import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { PurchasesPackage } from 'react-native-purchases';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';
import { obterPacoteAtual, comprarAssinatura, restaurarCompras, iniciarTrial } from '../utils/subscription';

const URL_PRIVACIDADE = 'https://trentini1.github.io/tecnoos-privacidade/';
const URL_TERMOS_USO = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

type Props = {
  uid: string;
  podeIniciarTrial: boolean;
  onLiberado: () => void;
  onVoltar?: () => void;
  onExcluirConta?: () => void;
};

const BENEFICIOS = [
  { icone: 'construct-outline', texto: 'Gestão completa de Ordens de Serviço' },
  { icone: 'people-outline', texto: 'Clientes ilimitados' },
  { icone: 'document-text-outline', texto: 'Exportação de PDF profissional' },
  { icone: 'create-outline', texto: 'Assinatura digital do cliente e do técnico' },
];

export default function PaywallScreen({ uid, podeIniciarTrial, onLiberado, onVoltar, onExcluirConta }: Props) {
  const tema = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);

  const [pacote, setPacote] = useState<PurchasesPackage | null>(null);
  const [carregandoOfertas, setCarregandoOfertas] = useState(true);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    obterPacoteAtual().then((p) => {
      setPacote(p);
      setCarregandoOfertas(false);
    });
  }, []);

  async function handleAssinar() {
    if (!pacote) return;
    setProcessando(true);
    try {
      const concluiu = await comprarAssinatura(pacote);
      if (concluiu) onLiberado();
    } catch {
      Alert.alert('Não foi possível concluir a compra', 'Tente novamente em instantes.');
    } finally {
      setProcessando(false);
    }
  }

  async function handleRestaurar() {
    setProcessando(true);
    try {
      const restaurado = await restaurarCompras();
      if (restaurado) {
        Alert.alert('Compra restaurada!', 'Sua assinatura Pro foi reativada.');
        onLiberado();
      } else {
        Alert.alert('Nenhuma assinatura encontrada', 'Não encontramos uma assinatura ativa para esta conta.');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível restaurar suas compras agora.');
    } finally {
      setProcessando(false);
    }
  }

  async function handleContinuarTrial() {
    setProcessando(true);
    try {
      await iniciarTrial(uid);
      onLiberado();
    } finally {
      setProcessando(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {onVoltar && (
          <TouchableOpacity onPress={onVoltar} style={[styles.voltarBotao, { backgroundColor: tema.card, borderColor: tema.borda }]}>
            <Ionicons name="arrow-back" size={20} color={tema.texto} />
          </TouchableOpacity>
        )}

        <View style={[styles.logoBox, { backgroundColor: tema.primario + '22', borderColor: tema.primario + '44' }]}>
          <Ionicons name="construct" size={30} color={tema.primario} />
        </View>

        <Text style={[styles.titulo, { color: tema.texto }]}>TecnoOS Pro</Text>
        <Text style={[styles.subtitulo, { color: tema.textoSec }]}>
          Tudo que sua equipe precisa para gerenciar ordens de serviço, clientes e relatórios em um só lugar.
        </Text>

        <View style={[styles.beneficiosCard, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          {BENEFICIOS.map((b) => (
            <View key={b.texto} style={styles.beneficioItem}>
              <View style={[styles.beneficioIcone, { backgroundColor: tema.primario + '1a' }]}>
                <Ionicons name={b.icone as any} size={16} color={tema.primario} />
              </View>
              <Text style={[styles.beneficioTexto, { color: tema.texto }]}>{b.texto}</Text>
            </View>
          ))}
        </View>

        <LinearGradient
          colors={[tema.primario, tema.primario + 'cc'] as any}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.assinarCard}
        >
          {carregandoOfertas ? (
            <ActivityIndicator color="#ffffff" />
          ) : pacote ? (
            <>
              <Text style={styles.assinarDuracao}>TecnoOS Pro · Assinatura mensal</Text>
              <Text style={styles.assinarPreco}>{pacote.product.priceString}/mês</Text>
              <TouchableOpacity
                style={styles.assinarBtn}
                onPress={handleAssinar}
                disabled={processando}
                activeOpacity={0.85}
              >
                <Text style={[styles.assinarBtnTexto, { color: tema.primario }]}>
                  {processando ? 'Processando...' : `Assinar por ${pacote.product.priceString}/mês`}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.assinarIndisponivel}>Assinatura em configuração — disponível em breve.</Text>
          )}
        </LinearGradient>

        <TouchableOpacity onPress={handleRestaurar} disabled={processando} style={styles.linkBtn}>
          <Text style={[styles.linkTexto, { color: tema.textoSec }]}>Restaurar compras</Text>
        </TouchableOpacity>

        <View style={styles.legalLinhas}>
          <TouchableOpacity onPress={() => Linking.openURL(URL_TERMOS_USO)}>
            <Text style={[styles.legalTexto, { color: tema.textoMuted }]}>Termos de Uso</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 11, color: tema.textoMuted }}> · </Text>
          <TouchableOpacity onPress={() => Linking.openURL(URL_PRIVACIDADE)}>
            <Text style={[styles.legalTexto, { color: tema.textoMuted }]}>Política de Privacidade</Text>
          </TouchableOpacity>
        </View>

        {podeIniciarTrial && (
          <TouchableOpacity onPress={handleContinuarTrial} disabled={processando} style={styles.linkBtn}>
            <Text style={[styles.linkTexto, { color: tema.textoMuted }]}>Continuar sem assinar (teste grátis por 7 dias)</Text>
          </TouchableOpacity>
        )}

        {onExcluirConta && (
          <TouchableOpacity onPress={onExcluirConta} disabled={processando} style={styles.linkBtn}>
            <Text style={[styles.linkTexto, { color: tema.textoFraco }]}>Excluir minha conta</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function criarEstilos(t: AppTema) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.fundo },
    scroll: { padding: 24, paddingTop: 60, paddingBottom: 48, alignItems: 'center' },
    voltarBotao: {
      position: 'absolute', top: 60, left: 0,
      width: 40, height: 40, borderRadius: 12, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center',
    },
    logoBox: {
      width: 64, height: 64, borderRadius: 18, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center', marginTop: 24, marginBottom: 16,
    },
    titulo: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
    subtitulo: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 8 },
    beneficiosCard: {
      width: '100%', borderRadius: 16, borderWidth: 1, padding: 16, gap: 14, marginBottom: 20,
    },
    beneficioItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    beneficioIcone: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    beneficioTexto: { fontSize: 13, fontWeight: '600', flex: 1 },
    assinarCard: { width: '100%', borderRadius: 18, padding: 20, alignItems: 'center', marginBottom: 12 },
    assinarDuracao: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', marginBottom: 4 },
    assinarPreco: { color: '#ffffff', fontSize: 22, fontWeight: '800', marginBottom: 14 },
    assinarBtn: { backgroundColor: '#ffffff', borderRadius: 14, paddingVertical: 15, paddingHorizontal: 20, width: '100%', alignItems: 'center' },
    assinarBtnTexto: { fontSize: 15, fontWeight: '800' },
    assinarIndisponivel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center', fontWeight: '600' },
    linkBtn: { paddingVertical: 10 },
    linkTexto: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
    legalLinhas: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
    legalTexto: { fontSize: 11, fontWeight: '600', textDecorationLine: 'underline' },
  });
}
