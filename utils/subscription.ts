/**
 * Assinatura TecnoOS Pro via RevenueCat (StoreKit 2).
 *
 * Configuração pendente do lado do usuário antes de testar em dispositivo:
 *   1. Criar o produto `com.trentini.servios.pro.MS` (Auto-Renewable Subscription,
 *      período de 1 mês) no App Store Connect.
 *   2. Criar conta em app.revenuecat.com, cadastrar o mesmo produto, um entitlement
 *      chamado "pro" e uma offering com um pacote mensal apontando para ele.
 *   3. Gerar um novo build de dev client (`eas build --profile development`) — é
 *      módulo nativo, não funciona no Expo Go nem no dev client já instalado.
 */

import { Platform } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { carregarAssinatura, salvarAssinatura, type DadosAssinatura } from './cloudStorage';

const REVENUECAT_API_KEY_IOS = 'appl_OfMOVDMNTbHSuLMiYtFihYujaVL';
const ENTITLEMENT_ID = 'TecnoOS Pro';
const DIAS_TRIAL = 7;

export type StatusAssinatura = {
  ativo: boolean;
  assinante: boolean;
  trial: boolean;
  trialUsado: boolean;
  diasRestantesTrial: number;
  expiraEm: Date | null;
  acessoManual: boolean;
  acessoManualAte: Date | null;
};

export type AcessoManual = { ativo: boolean; ativoAte: Date | null };

/**
 * No Android o acesso não passa pela RevenueCat/Play Billing (não configurado) — é
 * liberado manualmente pelo painel admin, gravando um prazo em
 * /acessosManuais/{email} no Firestore. Ver firestore.rules: só o e-mail do próprio
 * usuário (leitura) ou o e-mail admin (leitura/escrita) acessam esse documento.
 */
export async function verificarAcessoManual(email: string): Promise<AcessoManual> {
  try {
    const snap = await firestore().collection('acessosManuais').doc(email).get();
    const dados = snap.data();
    const ativoAte = dados?.ativoAte ? new Date(dados.ativoAte) : null;
    return { ativo: !!ativoAte && ativoAte.getTime() > Date.now(), ativoAte };
  } catch (e) {
    console.warn('[subscription] Não foi possível consultar acesso manual:', e);
    return { ativo: false, ativoAte: null };
  }
}

let revenueCatConfigurado = false;

export async function iniciarRevenueCat(uid: string): Promise<void> {
  try {
    if (!revenueCatConfigurado) {
      Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS, appUserID: uid });
      revenueCatConfigurado = true;
    } else {
      await Purchases.logIn(uid);
    }
  } catch (e) {
    console.warn('[subscription] Falha ao configurar RevenueCat (API key ainda não configurada?):', e);
  }
}

export async function verificarAssinatura(uid: string, email?: string): Promise<StatusAssinatura> {
  // Acesso liberado manualmente pelo painel admin (/acessosManuais/{email}).
  // Sincronizado nas duas plataformas: no Android é a única forma de acesso
  // (sem Play Billing); no iOS soma-se ao RevenueCat/trial normais.
  const acesso = email ? await verificarAcessoManual(email) : { ativo: false, ativoAte: null };

  if (Platform.OS === 'android') {
    return {
      ativo: acesso.ativo,
      assinante: false,
      trial: false,
      trialUsado: false,
      diasRestantesTrial: 0,
      expiraEm: acesso.ativoAte,
      acessoManual: acesso.ativo,
      acessoManualAte: acesso.ativoAte,
    };
  }

  let assinante = false;
  let expiraEm: Date | null = null;

  try {
    // O CustomerInfo é cacheado localmente pelo SDK e não se atualiza sozinho
    // quando a assinatura muda por fora do app (ex.: cancelamento nas
    // Assinaturas da Apple). Como essa checagem decide se o app libera ou
    // bloqueia o usuário, força buscar o estado real antes de ler.
    await Purchases.invalidateCustomerInfoCache();
    const info = await Purchases.getCustomerInfo();
    const entitlement = info.entitlements.active[ENTITLEMENT_ID];
    if (entitlement) {
      assinante = true;
      expiraEm = entitlement.expirationDate ? new Date(entitlement.expirationDate) : null;
    }
  } catch (e) {
    console.warn('[subscription] Não foi possível consultar o RevenueCat:', e);
  }

  const dados = await carregarAssinatura(uid);
  const trialUsado = !!dados?.trialIniciadoEm;
  let trial = false;
  let diasRestantesTrial = 0;

  if (dados?.trialIniciadoEm) {
    const decorridoMs = Date.now() - dados.trialIniciadoEm;
    const diasDecorridos = decorridoMs / (1000 * 60 * 60 * 24);
    diasRestantesTrial = Math.max(0, Math.ceil(DIAS_TRIAL - diasDecorridos));
    trial = diasRestantesTrial > 0;
  }

  if (assinante) {
    await salvarAssinatura(uid, { assinante: true, expiraEm: expiraEm?.getTime() ?? null });
  }

  return {
    ativo: assinante || trial || acesso.ativo,
    assinante,
    trial,
    trialUsado,
    diasRestantesTrial,
    expiraEm: expiraEm ?? acesso.ativoAte,
    acessoManual: acesso.ativo,
    acessoManualAte: acesso.ativoAte,
  };
}

export async function iniciarTrial(uid: string): Promise<void> {
  const dados = await carregarAssinatura(uid);
  if (dados?.trialIniciadoEm) return;
  await salvarAssinatura(uid, { trialIniciadoEm: Date.now() });
}

export async function obterPacoteAtual(): Promise<PurchasesPackage | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.monthly ?? offerings.current?.availablePackages[0] ?? null;
  } catch (e) {
    console.warn('[subscription] Não foi possível carregar as offerings do RevenueCat:', e);
    return null;
  }
}

export async function comprarAssinatura(pacote: PurchasesPackage): Promise<boolean> {
  try {
    await Purchases.purchasePackage(pacote);
    return true;
  } catch (e: any) {
    if (!e?.userCancelled) {
      console.warn('[subscription] Erro na compra:', e);
      throw e;
    }
    return false;
  }
}

export async function restaurarCompras(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  return !!info.entitlements.active[ENTITLEMENT_ID];
}
