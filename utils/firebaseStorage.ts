import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';

function uid(): string {
  const user = auth().currentUser;
  if (!user) throw new Error('Usuário não autenticado');
  return user.uid;
}

function extrairBase64EContentType(dataUrl: string): { base64: string; contentType: string } {
  const [cabecalho, base64] = dataUrl.split(',');
  const contentType = cabecalho.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  return { base64, contentType };
}

export async function uploadImagemStorage(caminho: string, dataUrl: string): Promise<string> {
  const { base64, contentType } = extrairBase64EContentType(dataUrl);
  const ref = storage().ref(`users/${uid()}/${caminho}`);
  // cacheControl permite que o cliente (e o <Image> do RN) reutilize a
  // imagem já baixada em vez de buscar novamente quando offline.
  await ref.putString(base64, 'base64', { contentType, cacheControl: 'public,max-age=31536000' });
  return ref.getDownloadURL();
}

export async function deletarImagemStorage(url: string): Promise<void> {
  try {
    await storage().refFromURL(url).delete();
  } catch {}
}
