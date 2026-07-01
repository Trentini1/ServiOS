import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

type Props = {
  fotos: string[];
  onChange: (fotos: string[]) => void;
  maxFotos?: number;
};

async function comprimirImagem(uri: string): Promise<string> {
  const resultado = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return `data:image/jpeg;base64,${resultado.base64}`;
}

export default function FotosOS({ fotos, onChange, maxFotos = 10 }: Props) {
  const [carregando, setCarregando] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);

  async function adicionarFoto() {
    if (fotos.length >= maxFotos) {
      Alert.alert('Limite atingido', `Máximo de ${maxFotos} fotos por OS.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria nas configurações.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: maxFotos - fotos.length,
      quality: 1,
    });

    if (resultado.canceled) return;

    setCarregando(true);
    try {
      const bases = await Promise.all(resultado.assets.map((a) => comprimirImagem(a.uri)));
      onChange([...fotos, ...bases].slice(0, maxFotos));
    } catch {
      Alert.alert('Erro', 'Não foi possível processar as imagens.');
    } finally {
      setCarregando(false);
    }
  }

  async function tirarFoto() {
    if (fotos.length >= maxFotos) {
      Alert.alert('Limite atingido', `Máximo de ${maxFotos} fotos por OS.`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à câmera nas configurações.');
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (resultado.canceled) return;

    setCarregando(true);
    try {
      const base = await comprimirImagem(resultado.assets[0].uri);
      onChange([...fotos, base]);
    } catch {
      Alert.alert('Erro', 'Não foi possível processar a imagem.');
    } finally {
      setCarregando(false);
    }
  }

  function confirmarRemocao(index: number) {
    Alert.alert('Remover foto', 'Deseja remover esta foto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: () => onChange(fotos.filter((_, i) => i !== index)),
      },
    ]);
  }

  function escolherOrigem() {
    Alert.alert('Adicionar foto', 'Escolha a origem', [
      { text: 'Câmera', onPress: tirarFoto },
      { text: 'Galeria', onPress: adicionarFoto },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {fotos.map((foto, i) => (
          <TouchableOpacity key={i} onPress={() => setFotoAmpliada(foto)} activeOpacity={0.85}>
            <Image source={{ uri: foto }} style={styles.thumb} resizeMode="cover" />
            <TouchableOpacity
              style={styles.removerBtn}
              onPress={() => confirmarRemocao(i)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Ionicons name="close-circle" size={20} color="#f87171" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {fotos.length < maxFotos && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={escolherOrigem}
            activeOpacity={0.8}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#2563eb" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={22} color="#2563eb" />
                <Text style={styles.addTexto}>
                  {fotos.length === 0 ? 'Adicionar' : `+${maxFotos - fotos.length}`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {fotos.length > 0 && (
        <Text style={styles.contador}>{fotos.length}/{maxFotos} fotos</Text>
      )}

      <Modal visible={!!fotoAmpliada} transparent animationType="fade">
        <Pressable style={styles.modalFundo} onPress={() => setFotoAmpliada(null)}>
          {fotoAmpliada && (
            <Image
              source={{ uri: fotoAmpliada }}
              style={styles.fotoAmpliada}
              resizeMode="contain"
            />
          )}
          <TouchableOpacity style={styles.fecharModal} onPress={() => setFotoAmpliada(null)}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingVertical: 4 },
  thumb: {
    width: 80, height: 80, borderRadius: 10,
    borderWidth: 1, borderColor: '#1f2937',
  },
  removerBtn: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#0b1220', borderRadius: 10,
  },
  addBtn: {
    width: 80, height: 80, borderRadius: 10,
    backgroundColor: '#2563eb11', borderWidth: 1,
    borderColor: '#2563eb55', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addTexto: { color: '#2563eb', fontSize: 11, fontWeight: '600' },
  contador: { color: '#475569', fontSize: 11, marginTop: 6 },
  modalFundo: {
    flex: 1, backgroundColor: '#000000ee',
    alignItems: 'center', justifyContent: 'center',
  },
  fotoAmpliada: { width: '95%', height: '80%' },
  fecharModal: {
    position: 'absolute', top: 60, right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#11182799', alignItems: 'center', justifyContent: 'center',
  },
});
