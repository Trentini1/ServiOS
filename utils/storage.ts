import AsyncStorage from '@react-native-async-storage/async-storage';

export async function salvar(chave: string, valor: unknown) {
  try {
    await AsyncStorage.setItem(chave, JSON.stringify(valor));
  } catch (e) {
    console.error('Erro ao salvar:', e);
  }
}

export async function carregar<T>(chave: string): Promise<T | null> {
  try {
    const valor = await AsyncStorage.getItem(chave);
    return valor ? JSON.parse(valor) : null;
  } catch (e) {
    console.error('Erro ao carregar:', e);
    return null;
  }
}

export async function remover(chave: string) {
  try {
    await AsyncStorage.removeItem(chave);
  } catch (e) {
    console.error('Erro ao remover:', e);
  }
}