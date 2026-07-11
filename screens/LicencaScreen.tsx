import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';
import { restaurarCompras, type StatusAssinatura } from '../utils/subscription';

const URL_PRIVACIDADE = 'https://trentini1.github.io/tecnoos-privacidade/';
const URL_TERMOS_USO = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

type Props = { uid: string; status: StatusAssinatura; onVoltar: () => void; onAbrirPaywall: () => void };

const RECURSOS_PRO = [
  'OS ilimitadas por mês',
  'Clientes e técnicos ilimitados',
  'Múltiplos usuários / equipe',
  'Relatórios avançados com exportação',
  'PDF personalizável com logo',
  'Backup automático na nuvem',
  'Assinatura digital de cliente e técnico',
];

function formatarData(data: Date): string {
  return data.toLocaleDateString('pt-BR');
}

export default function LicencaScreen({ uid, status, onVoltar, onAbrirPaywall }: Props) {
  const tema   = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);
  const [restaurando, setRestaurando] = useState(false);

  const corStatus = status.assinante ? '#16a34a' : status.trial ? '#d97706' : '#f87171';
  const tituloStatus = status.assinante
    ? 'Pro — Ativo'
    : status.trial
    ? `Teste grátis · ${status.diasRestantesTrial} dia${status.diasRestantesTrial === 1 ? '' : 's'} restante${status.diasRestantesTrial === 1 ? '' : 's'}`
    : 'Assinatura expirada';
  const infoStatus = status.assinante && status.expiraEm
    ? `Sua assinatura renova em ${formatarData(status.expiraEm)}.`
    : status.trial
    ? 'Aproveite o período de teste. Assine para continuar usando após o fim do trial.'
    : 'Assine o TecnoOS Pro para continuar usando todos os recursos.';

  function handleGerenciar() {
    Linking.openURL('itms-apps://apps.apple.com/account/subscriptions').catch(() => {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    });
  }

  async function handleRestaurar() {
    setRestaurando(true);
    try {
      const restaurado = await restaurarCompras();
      Alert.alert(
        restaurado ? 'Compra restaurada!' : 'Nenhuma assinatura encontrada',
        restaurado ? 'Sua assinatura Pro foi reativada.' : 'Não encontramos uma assinatura ativa para esta conta.'
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível restaurar suas compras agora.');
    } finally {
      setRestaurando(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={[styles.iconBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Ionicons name="arrow-back" size={20} color={tema.texto} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.titulo, { color: tema.texto }]}>Minha Licença</Text>
          <Text style={[styles.subtitulo, { color: tema.textoMuted }]}>Plano e assinatura</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Status atual */}
        <View style={[styles.planoAtualCard, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <View style={styles.planoAtualTop}>
            <View style={[styles.planoIcone, { backgroundColor: corStatus + '20' }]}>
              <Ionicons name={status.assinante ? 'shield-checkmark' : status.trial ? 'time-outline' : 'shield-outline'} size={22} color={corStatus} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planoAtualLabel, { color: tema.textoMuted }]}>Plano atual</Text>
              <Text style={[styles.planoAtualNome, { color: tema.texto }]}>{tituloStatus}</Text>
            </View>
          </View>
          <View style={[styles.divisor, { backgroundColor: tema.borda }]} />
          <Text style={[styles.planoAtualInfo, { color: tema.textoSec }]}>{infoStatus}</Text>
        </View>

        {status.assinante ? (
          <TouchableOpacity style={[styles.gerenciarBtn, { backgroundColor: tema.card, borderColor: tema.borda }]} onPress={handleGerenciar} activeOpacity={0.85}>
            <Ionicons name="settings-outline" size={16} color={tema.texto} />
            <Text style={[styles.gerenciarBtnTexto, { color: tema.texto }]}>Gerenciar assinatura</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.proCard, { shadowColor: tema.primario }]}>
            <LinearGradient
              colors={[tema.primario, tema.primario + 'cc'] as any}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.proBadge}>
              <Ionicons name="flash" size={11} color="#f59e0b" />
              <Text style={styles.proBadgeTexto}>PLANO PRO</Text>
            </View>
            <Text style={styles.proSubtitulo}>Desbloqueie todos os recursos do TecnoOS</Text>
            <View style={styles.proRecursos}>
              {RECURSOS_PRO.map((r) => (
                <View key={r} style={styles.proRecursoItem}>
                  <View style={styles.proCheckCircle}>
                    <Ionicons name="checkmark" size={10} color={tema.primario} />
                  </View>
                  <Text style={styles.proRecursoTexto}>{r}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.assinarBtn} onPress={onAbrirPaywall} activeOpacity={0.85}>
              <Ionicons name="flash" size={16} color={tema.primario} />
              <Text style={[styles.assinarBtnTexto, { color: tema.primario }]}>Ver plano Pro</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity onPress={handleRestaurar} disabled={restaurando} style={styles.restaurarBtn}>
          <Text style={[styles.restaurarTexto, { color: tema.textoMuted }]}>
            {restaurando ? 'Restaurando...' : 'Restaurar compras'}
          </Text>
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

        <Text style={[styles.rodape, { color: tema.textoFraco }]}>
          TecnoOS Pro · Desenvolvido por Erick Trentini
        </Text>
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

    planoAtualCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
    planoAtualTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    planoIcone: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    planoAtualLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
    planoAtualNome: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
    divisor: { height: 1, marginVertical: 14 },
    planoAtualInfo: { fontSize: 13, lineHeight: 20 },

    gerenciarBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      borderRadius: 14, borderWidth: 1, paddingVertical: 15, marginBottom: 16,
    },
    gerenciarBtnTexto: { fontSize: 14, fontWeight: '700' },

    proCard: {
      borderRadius: 20, padding: 20, marginBottom: 16, overflow: 'hidden',
      shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8,
    },
    proBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start',
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 16,
    },
    proBadgeTexto: { color: '#f59e0b', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
    proSubtitulo: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 20 },
    proRecursos: { gap: 10, marginBottom: 22 },
    proRecursoItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    proCheckCircle: {
      width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    proRecursoTexto: { color: '#ffffff', fontSize: 13, fontWeight: '500' },
    assinarBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: '#ffffff', borderRadius: 14, paddingVertical: 15,
    },
    assinarBtnTexto: { fontSize: 15, fontWeight: '800' },

    restaurarBtn: { paddingVertical: 10, marginBottom: 8 },
    restaurarTexto: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

    legalLinhas: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
    legalTexto: { fontSize: 11, fontWeight: '600', textDecorationLine: 'underline' },

    rodape: { textAlign: 'center', fontSize: 11, marginTop: 4 },
  });
}
