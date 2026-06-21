import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { carregar, salvar, remover } from '../utils/cloudStorage';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';

type Props = { onVoltar: () => void };

export default function LogoEmpresaScreen({ onVoltar }: Props) {
  const tema   = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);

  const [logo, setLogo]             = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando]     = useState(false);

  useEffect(() => {
    carregar<string>('logoEmpresa').then((uri) => {
      setLogo(uri ?? null);
      setCarregando(false);
    });
  }, []);

  async function escolherImagem() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de acesso à galeria para selecionar a logo. Permita nas configurações do dispositivo.',
      );
      return;
    }

    setEnviando(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const uri = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      await salvar('logoEmpresa', uri);
      setLogo(uri);
    }
    setEnviando(false);
  }

  async function removerLogo() {
    Alert.alert('Remover logo', 'Tem certeza que deseja remover a logo da empresa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          await remover('logoEmpresa');
          setLogo(null);
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onVoltar}
          style={[styles.iconBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}
        >
          <Ionicons name="arrow-back" size={20} color={tema.texto} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.titulo, { color: tema.texto }]}>Logo da Empresa</Text>
          <Text style={[styles.subtitulo, { color: tema.textoMuted }]}>
            Aparece nos relatórios e na tela inicial
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Preview principal */}
        <View style={[styles.previewCard, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Text style={[styles.previewLabel, { color: tema.textoMuted }]}>Preview da logo</Text>

          <View style={styles.previewCentro}>
            {carregando ? (
              <ActivityIndicator color={tema.primario} />
            ) : logo ? (
              <View style={styles.logoBig}>
                <Image source={{ uri: logo }} style={styles.logoBigImg} resizeMode="contain" />
                <TouchableOpacity style={styles.logoEditOverlay} onPress={escolherImagem} activeOpacity={0.7}>
                  <View style={[styles.logoEditCircle, { backgroundColor: tema.primario }]}>
                    <Ionicons name="camera" size={14} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.logoVazio, { borderColor: tema.borda, backgroundColor: tema.fundo }]}
                onPress={escolherImagem}
                activeOpacity={0.8}
              >
                <View style={[styles.logoVazioIcone, { backgroundColor: tema.primario + '20' }]}>
                  <Ionicons name="image-outline" size={28} color={tema.primario} />
                </View>
                <Text style={[styles.logoVazioTexto, { color: tema.texto }]}>Sem logo</Text>
                <Text style={[styles.logoVazioSub, { color: tema.textoFraco }]}>
                  Toque para adicionar
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Preview de como aparece no cabeçalho do PDF */}
          <Text style={[styles.previewLabel, { color: tema.textoMuted, marginTop: 20 }]}>
            Como aparece no PDF
          </Text>
          <View style={[styles.pdfPreview, { backgroundColor: tema.primario }]}>
            <View style={styles.pdfPreviewLeft}>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.pdfLogoImg} resizeMode="contain" />
              ) : (
                <View style={[styles.pdfLogoPlaceholder, { borderColor: 'rgba(255,255,255,0.3)' }]}>
                  <Ionicons name="image-outline" size={14} color="rgba(255,255,255,0.5)" />
                </View>
              )}
              <View>
                <Text style={styles.pdfEmpresaNome}>Nome da Empresa</Text>
                <Text style={styles.pdfEmpresaInfo}>CNPJ · Telefone · Endereço</Text>
              </View>
            </View>
            <View>
              <Text style={styles.pdfDocTitulo}>ORDEM DE SERVIÇO</Text>
              <Text style={styles.pdfDocData}>Emitido em {new Date().toLocaleDateString('pt-BR')}</Text>
            </View>
          </View>
        </View>

        {/* Preview no Home */}
        <View style={[styles.previewCard, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Text style={[styles.previewLabel, { color: tema.textoMuted }]}>
            Como aparece na tela inicial
          </Text>
          <View style={[styles.homePreview, { backgroundColor: tema.primario + 'cc' }]}>
            <LinearGradient
              colors={[tema.primario, tema.primario + 'aa']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.homePreviewTop}>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.homeLogoImg} resizeMode="contain" />
              ) : (
                <View style={[styles.homeLogoPlaceholder, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="business" size={14} color="rgba(255,255,255,0.5)" />
                </View>
              )}
              <View>
                <Text style={styles.homeSaudacao}>● Bom dia</Text>
                <Text style={styles.homeNome}>Erick</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Botões */}
        <TouchableOpacity
          style={[styles.btnPrincipal, { backgroundColor: tema.primario }, enviando && { opacity: 0.7 }]}
          onPress={escolherImagem}
          disabled={enviando}
          activeOpacity={0.85}
        >
          {enviando
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
          }
          <Text style={styles.btnPrincipalTexto}>
            {logo ? 'Trocar Logo' : 'Selecionar Logo da Galeria'}
          </Text>
        </TouchableOpacity>

        {logo && (
          <TouchableOpacity
            style={[styles.btnRemover, { borderColor: '#f8717144' }]}
            onPress={removerLogo}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={16} color="#f87171" />
            <Text style={styles.btnRemoverTexto}>Remover Logo</Text>
          </TouchableOpacity>
        )}

        {/* Dicas */}
        <View style={[styles.dicasCard, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <View style={styles.dicasHeader}>
            <Ionicons name="bulb-outline" size={15} color="#d97706" />
            <Text style={[styles.dicasTitulo, { color: tema.texto }]}>Dicas para uma boa logo</Text>
          </View>
          {[
            'Prefira imagens quadradas (1:1) para melhor resultado',
            'Fundo transparente (PNG) fica melhor no PDF',
            'Resolução mínima recomendada: 300×300 px',
            'Formatos aceitos: JPG, PNG, WEBP',
          ].map((d) => (
            <View key={d} style={styles.dicaItem}>
              <View style={[styles.dicaPonto, { backgroundColor: '#d97706' }]} />
              <Text style={[styles.dicaTexto, { color: tema.textoSec }]}>{d}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

function criarEstilos(t: AppTema) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.fundo },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    },
    iconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    titulo: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
    subtitulo: { fontSize: 12, marginTop: 1 },
    scroll: { padding: 20, paddingBottom: 48 },

    previewCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
    previewLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
    previewCentro: { alignItems: 'center', marginBottom: 4 },

    // Logo grande (preview)
    logoBig: { position: 'relative', width: 140, height: 140 },
    logoBigImg: { width: 140, height: 140, borderRadius: 16 },
    logoEditOverlay: { position: 'absolute', bottom: -6, right: -6 },
    logoEditCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

    logoVazio: {
      width: 140, height: 140, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed',
      alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    logoVazioIcone: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    logoVazioTexto: { fontSize: 14, fontWeight: '700' },
    logoVazioSub: { fontSize: 11 },

    // Preview PDF
    pdfPreview: {
      borderRadius: 10, padding: 12,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
      marginTop: 4,
    },
    pdfPreviewLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    pdfLogoImg: { width: 40, height: 40, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.9)' },
    pdfLogoPlaceholder: {
      width: 40, height: 40, borderRadius: 6, borderWidth: 1, borderStyle: 'dashed',
      alignItems: 'center', justifyContent: 'center',
    },
    pdfEmpresaNome: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
    pdfEmpresaInfo: { color: 'rgba(255,255,255,0.6)', fontSize: 9, marginTop: 2 },
    pdfDocTitulo: { color: '#ffffff', fontSize: 10, fontWeight: '700', textAlign: 'right' },
    pdfDocData: { color: 'rgba(255,255,255,0.6)', fontSize: 9, textAlign: 'right', marginTop: 2 },

    // Preview Home
    homePreview: { borderRadius: 12, padding: 14, overflow: 'hidden', marginTop: 4 },
    homePreviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    homeLogoImg: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.9)' },
    homeLogoPlaceholder: {
      width: 36, height: 36, borderRadius: 10, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center',
    },
    homeSaudacao: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },
    homeNome: { color: '#ffffff', fontSize: 18, fontWeight: '800' },

    // Botões
    btnPrincipal: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      borderRadius: 14, paddingVertical: 15, marginBottom: 12,
    },
    btnPrincipalTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },
    btnRemover: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      borderRadius: 14, paddingVertical: 13, borderWidth: 1, marginBottom: 20,
    },
    btnRemoverTexto: { color: '#f87171', fontSize: 14, fontWeight: '600' },

    // Dicas
    dicasCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
    dicasHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    dicasTitulo: { fontSize: 13, fontWeight: '700' },
    dicaItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
    dicaPonto: { width: 5, height: 5, borderRadius: 3, marginTop: 5, flexShrink: 0 },
    dicaTexto: { flex: 1, fontSize: 12, lineHeight: 18 },
  });
}
