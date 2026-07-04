import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUBCOLECOES = ['clientes', 'ordensServico', 'dados'];
const DOCS_UNICOS = ['empresa', 'assinatura'];

async function deletarSubcolecoes(uid: string): Promise<void> {
  const userRef = firestore().collection('users').doc(uid);

  for (const nome of SUBCOLECOES) {
    const snap = await userRef.collection(nome).get();
    if (snap.empty) continue;
    const batch = firestore().batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  for (const nome of DOCS_UNICOS) {
    await userRef.collection(nome).doc('dados').delete();
  }
}

async function deletarPastaStorage(caminho: string): Promise<void> {
  const ref = storage().ref(caminho);
  const resultado = await ref.listAll();
  await Promise.all(resultado.items.map((item) => item.delete()));
  await Promise.all(resultado.prefixes.map((prefixo) => deletarPastaStorage(prefixo.fullPath)));
}

export async function excluirContaCompleta(uid: string): Promise<void> {
  const user = auth().currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  try {
    await deletarSubcolecoes(uid);
  } catch (e) {
    console.warn('[excluirConta] Erro ao apagar dados do Firestore:', e);
  }

  try {
    await deletarPastaStorage(`users/${uid}`);
  } catch (e) {
    console.warn('[excluirConta] Erro ao apagar arquivos do Storage:', e);
  }

  await user.delete();
  await AsyncStorage.clear();
}
