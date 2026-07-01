/**
 * Armazenamento em nuvem via Firestore.
 *
 * Estrutura no Firestore:
 *   /users/{uid}/empresa/dados        →  documento único da empresa
 *   /users/{uid}/clientes/{clienteId} →  coleção de clientes
 *   /users/{uid}/ordensServico/{osId} →  coleção de ordens de serviço
 *   /users/{uid}/dados/{chave}        →  demais dados (técnicos, agenda, temas, config...)
 *
 * Imagens (base64) de fotos e assinaturas de OS são automaticamente
 * enviadas ao Firebase Storage e substituídas por URLs antes de salvar.
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { carregar as carregarLocal, salvar as salvarLocal, remover as removerLocal } from './storage';
import { uploadImagemStorage } from './firebaseStorage';
import type { OrdemServico } from '../screens/OSListScreen';
import type { Cliente } from '../screens/ClientListScreen';

// O Firestore rejeita campos com valor `undefined` (comuns aqui, já que
// campos opcionais da OS/cliente ficam undefined quando desativados).
function removerUndefined<T extends Record<string, any>>(obj: T): T {
  const limpo: any = {};
  for (const chave of Object.keys(obj)) {
    if (obj[chave] !== undefined) limpo[chave] = obj[chave];
  }
  return limpo;
}

function uidAtual(): string {
  const user = auth().currentUser;
  if (!user) throw new Error('Usuário não autenticado');
  return user.uid;
}

function refDoc(chave: string) {
  return firestore().collection('users').doc(uidAtual()).collection('dados').doc(chave);
}

// ── Genérico (técnicos, agenda, temas, config, etc.) ────────

export async function carregar<T>(chave: string): Promise<T | null> {
  try {
    const snap = await refDoc(chave).get();
    if (!snap.exists) return null;
    const val = snap.data()?.value ?? null;
    if (val !== null) salvarLocal(chave, val);
    return val as T | null;
  } catch {
    return carregarLocal<T>(chave);
  }
}

export async function salvar<T>(chave: string, valor: T): Promise<void> {
  const valorProcessado = await processarAntesDeSalvar(chave, valor);
  try {
    await refDoc(chave).set({ value: valorProcessado });
  } catch (e) {
    console.warn('[cloudStorage] Firestore offline, salvando localmente:', chave);
  }
  await salvarLocal(chave, valorProcessado);
}

export async function remover(chave: string): Promise<void> {
  try {
    await refDoc(chave).delete();
  } catch {}
  await removerLocal(chave);
}

async function processarAntesDeSalvar<T>(chave: string, valor: T): Promise<T> {
  try {
    if (chave === 'logoEmpresa' && typeof valor === 'string' && (valor as string).startsWith('data:')) {
      const url = await uploadImagemStorage(`logo/logo_${Date.now()}.jpg`, valor as string);
      return url as T;
    }
  } catch (e) {
    console.warn('[cloudStorage] Erro ao processar imagem:', e);
  }
  return valor;
}

// ── Empresa (documento único) ───────────────────────────────

function refEmpresa(uid: string) {
  return firestore().collection('users').doc(uid).collection('empresa').doc('dados');
}

export async function salvarEmpresa<T extends Record<string, any>>(uid: string, dados: T): Promise<void> {
  const limpo = removerUndefined(dados);
  try {
    await refEmpresa(uid).set(limpo, { merge: true });
  } catch {
    console.warn('[cloudStorage] Firestore offline, empresa salva apenas localmente');
  }
  await salvarLocal('empresa', limpo);
}

export async function carregarEmpresa<T = any>(uid: string): Promise<T | null> {
  try {
    const snap = await refEmpresa(uid).get();
    if (!snap.exists) return carregarLocal<T>('empresa');
    const dados = snap.data() as T;
    await salvarLocal('empresa', dados);
    return dados;
  } catch {
    return carregarLocal<T>('empresa');
  }
}

// ── Clientes (coleção) ──────────────────────────────────────

function refClientes(uid: string) {
  return firestore().collection('users').doc(uid).collection('clientes');
}

export async function salvarCliente(uid: string, cliente: Cliente): Promise<void> {
  const id = cliente.id || Date.now().toString();
  const dados: Cliente = removerUndefined({ ...cliente, id });
  try {
    await refClientes(uid).doc(id).set(dados, { merge: true });
  } catch {
    console.warn('[cloudStorage] Firestore offline, cliente salvo apenas localmente');
  }
  const listaLocal = (await carregarLocal<Cliente[]>('clientes')) ?? [];
  const idx = listaLocal.findIndex((c) => c.id === id);
  if (idx >= 0) listaLocal[idx] = dados; else listaLocal.push(dados);
  await salvarLocal('clientes', listaLocal);
}

export async function listarClientes(uid: string): Promise<Cliente[]> {
  try {
    const snap = await refClientes(uid).get();
    const lista = snap.docs.map((d) => d.data() as Cliente);
    await salvarLocal('clientes', lista);
    return lista;
  } catch {
    return (await carregarLocal<Cliente[]>('clientes')) ?? [];
  }
}

export async function deletarCliente(uid: string, clienteId: string): Promise<void> {
  try {
    await refClientes(uid).doc(clienteId).delete();
  } catch {}
  const listaLocal = (await carregarLocal<Cliente[]>('clientes')) ?? [];
  await salvarLocal('clientes', listaLocal.filter((c) => c.id !== clienteId));
}

// ── Ordens de Serviço (coleção) ──────────────────────────────

function refOrdens(uid: string) {
  return firestore().collection('users').doc(uid).collection('ordensServico');
}

const ehBase64 = (v?: string) => typeof v === 'string' && v.startsWith('data:');

async function uploadSeBase64(v: string, caminho: string): Promise<string> {
  if (!ehBase64(v)) return v;
  try { return await uploadImagemStorage(caminho, v); }
  catch { return v; }
}

// Detecta fotos/assinaturas em base64 e envia ao Firebase Storage antes
// de gravar no Firestore (evita estourar o limite de 1MB por documento).
async function processarMidiasOS(osId: string, dados: any): Promise<any> {
  const resultado = { ...dados };

  if (Array.isArray(dados.fotos)) {
    resultado.fotos = await Promise.all(
      (dados.fotos as string[]).map((f, i) => uploadSeBase64(f, `fotos/${osId}/${Date.now()}_${i}.jpg`))
    );
  }
  if (dados.assinaturaTecnico) {
    resultado.assinaturaTecnico = await uploadSeBase64(dados.assinaturaTecnico, `assinaturas/${osId}/tecnico_${Date.now()}.jpg`);
  }
  if (dados.assinaturaCliente) {
    resultado.assinaturaCliente = await uploadSeBase64(dados.assinaturaCliente, `assinaturas/${osId}/cliente_${Date.now()}.jpg`);
  }
  return resultado;
}

// Como a OS é gravada com merge:true, um campo opcional desativado (que
// chega aqui como undefined) precisa virar FieldValue.delete() — do
// contrário o Firestore simplesmente ignora a chave e mantém o valor antigo.
function prepararEscritaOS<T extends Record<string, any>>(obj: T): Record<string, any> {
  const preparado: Record<string, any> = {};
  for (const chave of Object.keys(obj)) {
    preparado[chave] = obj[chave] === undefined ? firestore.FieldValue.delete() : obj[chave];
  }
  return preparado;
}

export async function salvarOS(uid: string, os: OrdemServico): Promise<void> {
  const id = os.id || Date.now().toString();
  const processada = await processarMidiasOS(id, { ...os, id });
  try {
    await refOrdens(uid).doc(id).set(prepararEscritaOS(processada), { merge: true });
  } catch {
    console.warn('[cloudStorage] Firestore offline, OS salva apenas localmente');
  }
  const semUndefined = removerUndefined(processada);
  const listaLocal = (await carregarLocal<OrdemServico[]>('ordensServico')) ?? [];
  const idx = listaLocal.findIndex((o) => o.id === id);
  if (idx >= 0) listaLocal[idx] = semUndefined; else listaLocal.push(semUndefined);
  await salvarLocal('ordensServico', listaLocal);
}

export async function listarOS(uid: string): Promise<OrdemServico[]> {
  try {
    const snap = await refOrdens(uid).get();
    const lista = snap.docs.map((d) => d.data() as OrdemServico);
    await salvarLocal('ordensServico', lista);
    return lista;
  } catch {
    return (await carregarLocal<OrdemServico[]>('ordensServico')) ?? [];
  }
}

export async function atualizarOS(uid: string, osId: string, dados: Partial<OrdemServico>): Promise<void> {
  const processada = await processarMidiasOS(osId, dados);
  try {
    await refOrdens(uid).doc(osId).set(prepararEscritaOS(processada), { merge: true });
  } catch {
    console.warn('[cloudStorage] Firestore offline, alteração da OS salva apenas localmente');
  }
  const semUndefined = removerUndefined(processada);
  const listaLocal = (await carregarLocal<OrdemServico[]>('ordensServico')) ?? [];
  const idx = listaLocal.findIndex((o) => o.id === osId);
  if (idx >= 0) {
    listaLocal[idx] = removerUndefined({ ...listaLocal[idx], ...processada });
    await salvarLocal('ordensServico', listaLocal);
  }
}

export async function deletarOS(uid: string, osId: string): Promise<void> {
  try {
    await refOrdens(uid).doc(osId).delete();
  } catch {}
  const listaLocal = (await carregarLocal<OrdemServico[]>('ordensServico')) ?? [];
  await salvarLocal('ordensServico', listaLocal.filter((o) => o.id !== osId));
}
