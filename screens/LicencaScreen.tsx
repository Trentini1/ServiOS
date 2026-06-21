import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';

type Props = { onVoltar: () => void };

const PLANO_PRO_PRECO = 'R$ 50,00 / mês';

const RECURSOS_GRATIS = [
  { ok: true,  label: 'Até 10 Ordens de Serviço/mês' },
  { ok: true,  label: 'Clientes ilimitados'           },
  { ok: true,  label: '1 usuário'                     },
  { ok: true,  label: 'PDF básico'                    },
  { ok: false, label: 'OS ilimitadas'                 },
  { ok: false, label: 'Múltiplos usuários'            },
  { ok: false, label: 'Relatórios avançados'          },
  { ok: false, label: 'Backup na nuvem'               },
  { ok: false, label: 'Suporte prioritário'           },
];

const RECURSOS_PRO = [
  'OS ilimitadas por mês',
  'Clientes e técnicos ilimitados',
  'Múltiplos usuários / equipe',
  'Relatórios avançados com exportação',
  'PDF personalizável com logo',
  'Backup automático na nuvem',
  'Suporte prioritário via WhatsApp',
  'Agenda e agendamentos avançados',
  'Histórico completo por cliente',
];

export default function LicencaScreen({ onVoltar }: Props) {
  const tema   = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);

  function handleAssinar() {
    Alert.alert(
      'Em breve!',
      'O sistema de assinaturas estará disponível em breve. Você será notificado assim que for liberado.',
      [{ text: 'OK' }]
    );
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
          <Text style={[styles.subtitulo, { color: tema.textoMuted }]}>Planos e assinatura</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Status atual — Plano Gratuito */}
        <View style={[styles.planoAtualCard, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <View style={styles.planoAtualTop}>
            <View style={[styles.planoIcone, { backgroundColor: tema.primario + '20' }]}>
              <Ionicons name="shield-outline" size={22} color={tema.primario} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planoAtualLabel, { color: tema.textoMuted }]}>Plano atual</Text>
              <Text style={[styles.planoAtualNome, { color: tema.texto }]}>Gratuito</Text>
            </View>
            <View style={[styles.planoBadge, { backgroundColor: tema.primario + '20', borderColor: tema.primario + '44' }]}>
              <Text style={[styles.planoBadgeTexto, { color: tema.primario }]}>ATIVO</Text>
            </View>
          </View>
          <View style={[styles.divisor, { backgroundColor: tema.borda }]} />
          <Text style={[styles.planoAtualInfo, { color: tema.textoSec }]}>
            Você está usando a versão gratuita do ServiOS. Faça upgrade para o Plano Pro e desbloqueie todos os recursos.
          </Text>
        </View>

        {/* Card PRO */}
        <View style={[styles.proCard, { shadowColor: '#6366f1' }]}>
          <LinearGradient
            colors={['#6366f1', '#8b5cf6', '#a855f7'] as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Badge PRO */}
          <View style={styles.proBadge}>
            <Ionicons name="flash" size={11} color="#f59e0b" />
            <Text style={styles.proBadgeTexto}>PLANO PRO</Text>
          </View>

          {/* Preço */}
          <View style={styles.precoRow}>
            <Text style={styles.preco}>{PLANO_PRO_PRECO}</Text>
          </View>
          <Text style={styles.proSubtitulo}>Tudo que você precisa para crescer</Text>

          {/* Recursos */}
          <View style={styles.proRecursos}>
            {RECURSOS_PRO.map((r) => (
              <View key={r} style={styles.proRecursoItem}>
                <View style={styles.proCheckCircle}>
                  <Ionicons name="checkmark" size={10} color="#6366f1" />
                </View>
                <Text style={styles.proRecursoTexto}>{r}</Text>
              </View>
            ))}
          </View>

          {/* Botão */}
          <TouchableOpacity style={styles.assinarBtn} onPress={handleAssinar} activeOpacity={0.85}>
            <Ionicons name="flash" size={16} color="#6366f1" />
            <Text style={styles.assinarBtnTexto}>Assinar Plano Pro</Text>
          </TouchableOpacity>

          <Text style={styles.proRodape}>Cancele quando quiser · Sem fidelidade</Text>
        </View>

        {/* Comparativo */}
        <View style={[styles.comparativoCard, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Text style={[styles.comparativoTitulo, { color: tema.textoSec }]}>O que está incluso no Gratuito</Text>
          {RECURSOS_GRATIS.map((r) => (
            <View key={r.label} style={styles.comparativoItem}>
              <View style={[styles.comparativoIcone, { backgroundColor: r.ok ? '#16a34a18' : '#f8717118' }]}>
                <Ionicons
                  name={r.ok ? 'checkmark' : 'close'}
                  size={12}
                  color={r.ok ? '#16a34a' : '#f87171'}
                />
              </View>
              <Text style={[styles.comparativoTexto, { color: r.ok ? tema.texto : tema.textoMuted }]}>
                {r.label}
              </Text>
            </View>
          ))}
        </View>

        {/* FAQ rápido */}
        <View style={[styles.faqCard, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Text style={[styles.faqTitulo, { color: tema.texto }]}>Perguntas frequentes</Text>
          {[
            { p: 'Como é feita a cobrança?',   r: 'Mensalmente via cartão de crédito, Pix ou boleto. Você pode cancelar a qualquer momento.' },
            { p: 'Meus dados ficam seguros?',  r: 'Sim. No plano Pro seus dados são sincronizados com backup automático na nuvem.' },
            { p: 'Posso mudar de plano?',       r: 'Sim, você pode fazer upgrade ou downgrade do plano a qualquer momento.' },
          ].map((faq, i, arr) => (
            <View key={faq.p} style={[styles.faqItem, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: tema.borda }]}>
              <Text style={[styles.faqPergunta, { color: tema.texto }]}>{faq.p}</Text>
              <Text style={[styles.faqResposta, { color: tema.textoSec }]}>{faq.r}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.rodape, { color: tema.textoFraco }]}>
          ServiOS Pro · Desenvolvido por Erick Trentini
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

    // Plano atual
    planoAtualCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
    planoAtualTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    planoIcone: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    planoAtualLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
    planoAtualNome: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
    planoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    planoBadgeTexto: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    divisor: { height: 1, marginVertical: 14 },
    planoAtualInfo: { fontSize: 13, lineHeight: 20 },

    // Card PRO
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
    precoRow: { marginBottom: 4 },
    preco: { color: '#ffffff', fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
    proSubtitulo: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 20 },
    proRecursos: { gap: 10, marginBottom: 22 },
    proRecursoItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    proCheckCircle: {
      width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    proRecursoTexto: { color: '#ffffff', fontSize: 13, fontWeight: '500' },
    assinarBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: '#ffffff', borderRadius: 14, paddingVertical: 15, marginBottom: 12,
    },
    assinarBtnTexto: { color: '#6366f1', fontSize: 15, fontWeight: '800' },
    proRodape: { color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'center' },

    // Comparativo
    comparativoCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
    comparativoTitulo: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },
    comparativoItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    comparativoIcone: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    comparativoTexto: { fontSize: 13 },

    // FAQ
    faqCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
    faqTitulo: { fontSize: 13, fontWeight: '700', padding: 16, paddingBottom: 12 },
    faqItem: { padding: 14 },
    faqPergunta: { fontSize: 13, fontWeight: '700', marginBottom: 5 },
    faqResposta: { fontSize: 12, lineHeight: 18 },

    rodape: { textAlign: 'center', fontSize: 11, marginTop: 4 },
  });
}
