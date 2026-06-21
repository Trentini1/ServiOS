/**
 * Armazenamento em nuvem via Firestore.
 * API idêntica a utils/storage.ts — basta trocar o import nas telas.
 *
 * Estrutura no Firestore:
 *   /users/{uid}/dados/{chave}  →  { value: <dados> }
 *
 * Imagens (base64) são automaticamente enviadas ao Firebase Storage
 * e substituídas por URLs antes de salvar no Firestore.
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { carregar as carregarLocal, salvar as salvarLocal, remover as removerLocal } from './storage';
import { uploadImagemStorage } from './firebaseStorage';

function uid(): string {
  const user = auth().currentUser;
  if (!user) throw new Error('Usuário não autenticado');
  return user.uid;
}

function refDoc(chave: string) {
  return firestore().collection('users').doc(uid()).collection('dados').doc(chave);
}

// ── Leitura ──────────────────────────────────────────────────

export async function carregar<T>(chave: string): Promise<T | null> {
  try {
    const snap = await refDoc(chave).get();
    if (!snap.exists) return null;
    const val = snap.data()?.value ?? null;
    // Atualiza cache local
    if (val !== null) salvarLocal(chave, val);
    return val as T | null;
  } catch {
    // Fallback offline: retorna cache local
    return carregarLocal<T>(chave);
  }
}

// ── Escrita ──────────────────────────────────────────────────

export async function salvar<T>(chave: string, valor: T): Promise<void> {
  const valorProcessado = await processarAntesDeSalvar(chave, valor);
  try {
    await refDoc(chave).set({ value: valorProcessado });
  } catch (e) {
    // Se falhou (offline), só salva local; sincroniza quando reconectar
    console.warn('[cloudStorage] Firestore offline, salvando localmente:', chave);
  }
  // Sempre salva local como cache
  await salvarLocal(chave, valorProcessado);
}

// ── Remoção ──────────────────────────────────────────────────

export async function remover(chave: string): Promise<void> {
  try {
    await refDoc(chave).delete();
  } catch {}
  await removerLocal(chave);
}

// ── Processamento de imagens ─────────────────────────────────
// Detecta base64 e faz upload para Firebase Storage antes de salvar no Firestore.
// Isso evita estourar o limite de 1MB por documento.

async function processarAntesDeSalvar<T>(chave: string, valor: T): Promise<T> {
  try {
    // Logo da empresa
    if (chave === 'logoEmpresa' && typeof valor === 'string' && (valor as string).startsWith('data:')) {
      const url = await uploadImagemStorage(`logo/logo_${Date.now()}`, valor as string);
      return url as T;
    }

    // Ordens de serviço: fotos e assinaturas
    if (chave === 'ordensServico' && Array.isArray(valor)) {
      const ordens = await Promise.all((valor as any[]).map(processarOS));
      return ordens as T;
    }
  } catch (e) {
    console.warn('[cloudStorage] Erro ao processar imagens:', e);
  }
  return valor;
}

async function processarOS(os: any): Promise<any> {
  const temBase64 = (v?: string) => typeof v === 'string' && v.startsWith('data:');

  const uploadSeBase64 = async (v: string, caminho: string): Promise<string> => {
    if (temBase64(v)) {
      try { return await uploadImagemStorage(caminho, v); }
      catch { return v; }
    }
    return v;
  };

  const fotos = os.fotos
    ? await Promise.all(
        (os.fotos as string[]).map((f, i) =>
          uploadSeBase64(f, `fotos/${os.id}/${i}_${Date.now()}`)
        )
      )
    : os.fotos;

  const assinaturaTecnico = os.assinaturaTecnico
    ? await uploadSeBase64(os.assinaturaTecnico, `assinaturas/${os.id}/tecnico`)
    : os.assinaturaTecnico;

  const assinaturaCliente = os.assinaturaCliente
    ? await uploadSeBase64(os.assinaturaCliente, `assinaturas/${os.id}/cliente`)
    : os.assinaturaCliente;

  return { ...os, fotos, assinaturaTecnico, assinaturaCliente };
}
