import { useRef, useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Dimensions, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { carregar, listarOS, listarClientes } from '../utils/cloudStorage';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';
import type { OrdemServico } from './OSListScreen';
import type { Cliente } from './ClientListScreen';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - 56) / 2;

type Empresa = {
  nome: string; cnpj?: string; telefone?: string;
  segmento?: string; cidade?: string; estado?: string;
};

type Props = {
  uid: string;
  usuario: string;
  empresa: Empresa;
  onSair: () => void;
  onAbrirMenu: (id: string) => void;
  onAbrirConfiguracoes: () => void;
};

const MENU = [
  { id: 'os',            titulo: 'Ordens de\nServiço', icone: 'document-text', gradiente: ['#2563eb', '#1d4ed8'] as const },
  { id: 'clientes',      titulo: 'Clientes',             icone: 'people',        gradiente: ['#16a34a', '#15803d'] as const },
  { id: 'agenda',        titulo: 'Agenda',                icone: 'calendar',      gradiente: ['#d97706', '#b45309'] as const },
  { id: 'relatorios',    titulo: 'Relatórios',            icone: 'bar-chart',     gradiente: ['#9333ea', '#7e22ce'] as const },
  { id: 'tecnicos',      titulo: 'Técnicos',              icone: 'construct',     gradiente: ['#0891b2', '#0e7490'] as const },
  { id: 'configuracoes', titulo: 'Configurações',         icone: 'settings',      gradiente: ['#475569', '#334155'] as const },
] as const;

const CORES_STATUS: Record<string, string> = {
  Aberta: '#d97706', 'Em Andamento': '#2563eb', 'Concluída': '#16a34a',
};

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HomeScreen({ uid, usuario, empresa, onSair, onAbrirMenu, onAbrirConfiguracoes }: Props) {
  const tema   = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);

  const fade       = useRef(new Animated.Value(0)).current;
  const slideY     = useRef(new Animated.Value(30)).current;
  const scaleStats = useRef(new Animated.Value(0.93)).current;

  const [carregando, setCarregando]       = useState(true);
  const [osAbertas, setOsAbertas]         = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [agendadas, setAgendadas]         = useState(0);
  const [recentes, setRecentes]           = useState<OrdemServico[]>([]);
  const [logo, setLogo]                   = useState<string | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,   { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleStats, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();

    (async () => {
      const [ordens, cls, logoSalva] = await Promise.all([
        listarOS(uid),
        listarClientes(uid),
        carregar<string>('logoEmpresa'),
      ]);
      setLogo(logoSalva ?? null);
      const hoje = new Date().toISOString().split('T')[0];
      setOsAbertas(ordens.filter((o) => o.status === 'Aberta' || o.status === 'Em Andamento').length);
      setTotalClientes(cls.length);
      setAgendadas(ordens.filter((o) => o.dataAgendada && o.dataAgendada >= hoje).length);
      setRecentes([...ordens].reverse().slice(0, 4));
      setCarregando(false);
    })();
  }, [uid]);

  const primeiroNome = usuario.split(' ')[0];

  function handleMenu(id: string) {
    if (id === 'configuracoes') onAbrirConfiguracoes();
    else onAbrirMenu(id);
  }

  if (carregando) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={tema.primario} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>

        {/* HERO */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[tema.primario, tema.primario + 'cc', tema.fundo + '00'] as any}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.heroCirculo,  { backgroundColor: '#ffffff08' }]} />
          <View style={[styles.heroCirculo2, { backgroundColor: '#ffffff05' }]} />

          <Animated.View style={{ opacity: fade, transform: [{ translateY: slideY }] }}>
            <View style={styles.heroTop}>
              <View style={styles.heroSaudacaoBox}>
                <View style={styles.heroPonto} />
                <Text style={styles.heroSaudacao}>{saudacao()}</Text>
              </View>
              <View style={styles.heroAcoes}>
                <TouchableOpacity style={styles.heroBtn} onPress={onAbrirConfiguracoes} activeOpacity={0.75}>
                  <Ionicons name="settings-outline" size={18} color="rgba(255,255,255,0.9)" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.heroBtn, styles.heroBtnSair]} onPress={onSair} activeOpacity={0.75}>
                  <Ionicons name="log-out-outline" size={18} color="#fca5a5" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.heroNomeRow}>
              <Text style={styles.heroNome}>{primeiroNome}</Text>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.heroLogo} resizeMode="contain" />
              ) : null}
            </View>

            <View style={styles.heroEmpresaRow}>
              <View style={styles.heroEmpresaBadge}>
                <Ionicons name="business" size={11} color="rgba(255,255,255,0.7)" />
                <Text style={styles.heroEmpresaTexto} numberOfLines={1}>{empresa.nome}</Text>
              </View>
              {empresa.segmento ? (
                <View style={[styles.heroEmpresaBadge, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                  <Text style={styles.heroEmpresaTexto}>{empresa.segmento}</Text>
                </View>
              ) : null}
            </View>
          </Animated.View>

          <Animated.View style={[styles.statsRow, { transform: [{ scale: scaleStats }] }]}>
            {[
              { label: 'Em Aberto', valor: osAbertas,    icone: 'document-text', fundo: 'rgba(255,255,255,0.12)', cor: '#ffffff' },
              { label: 'Clientes',  valor: totalClientes, icone: 'people',        fundo: 'rgba(255,255,255,0.12)', cor: '#ffffff' },
              { label: 'Agendadas', valor: agendadas,     icone: 'calendar',      fundo: 'rgba(251,191,36,0.18)',  cor: '#fbbf24' },
            ].map((s) => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: s.fundo }]}>
                <View style={styles.statTop}>
                  <Ionicons name={s.icone as any} size={11} color={s.cor} style={{ opacity: 0.75 }} />
                  <Text style={[styles.statLabel, { color: s.cor }]}>{s.label}</Text>
                </View>
                <Text style={[styles.statNum, { color: s.cor }]}>{s.valor}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        <Animated.View style={[styles.corpo, { opacity: fade, transform: [{ translateY: slideY }] }]}>

          <View style={styles.secaoHeader}>
            <Text style={[styles.secaoTitulo, { color: tema.texto }]}>Acesso Rápido</Text>
            <View style={[styles.secaoLinha, { backgroundColor: tema.borda }]} />
          </View>

          <View style={styles.grid}>
            {MENU.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.gridCard, { backgroundColor: tema.card, borderColor: tema.borda }]}
                onPress={() => handleMenu(item.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[...item.gradiente] as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gridCardTopo}
                >
                  <View style={styles.gridCirculo} />
                  <Ionicons name={item.icone as any} size={28} color="#ffffff" />
                </LinearGradient>
                <View style={styles.gridCardRodape}>
                  <Text style={[styles.gridCardTitulo, { color: tema.texto }]}>{item.titulo}</Text>
                  <View style={[styles.gridArrow, { backgroundColor: tema.fundo }]}>
                    <Ionicons name="arrow-forward" size={10} color={tema.textoFraco} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.secaoHeader, { marginTop: 6 }]}>
            <Text style={[styles.secaoTitulo, { color: tema.texto }]}>Atividade Recente</Text>
            <View style={[styles.secaoLinha, { backgroundColor: tema.borda }]} />
          </View>

          {recentes.length === 0 ? (
            <View style={[styles.vazio, { backgroundColor: tema.card, borderColor: tema.borda }]}>
              <LinearGradient
                colors={[tema.primario + '18', tema.primario + '04'] as any}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.vazioIconeBox, { backgroundColor: tema.primario + '20' }]}>
                <Ionicons name="document-text-outline" size={26} color={tema.primario} />
              </View>
              <Text style={[styles.vazioTitulo, { color: tema.texto }]}>Nenhuma OS ainda</Text>
              <Text style={[styles.vazioSub, { color: tema.textoMuted }]}>
                Crie sua primeira Ordem de Serviço para começar
              </Text>
              <TouchableOpacity
                style={[styles.vazioBtn, { backgroundColor: tema.primario }]}
                onPress={() => onAbrirMenu('os')}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={15} color="#fff" />
                <Text style={styles.vazioBtnTexto}>Nova OS</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.atividadeCard, { backgroundColor: tema.card, borderColor: tema.borda }]}>
              {recentes.map((os, idx) => {
                const cor = CORES_STATUS[os.status] ?? '#64748b';
                return (
                  <TouchableOpacity
                    key={os.id}
                    style={[
                      styles.atividadeItem,
                      idx < recentes.length - 1 && { borderBottomWidth: 1, borderBottomColor: tema.borda },
                    ]}
                    onPress={() => onAbrirMenu('os')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.atividadeDot, { backgroundColor: cor }]} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.atividadeTopRow}>
                        <Text style={[styles.atividadeCliente, { color: tema.texto }]} numberOfLines={1}>
                          {os.cliente}
                        </Text>
                        <View style={[styles.statusPill, { backgroundColor: cor + '20', borderColor: cor + '55' }]}>
                          <Text style={[styles.statusPillTexto, { color: cor }]}>{os.status}</Text>
                        </View>
                      </View>
                      <Text style={[styles.atividadeDetalhe, { color: tema.textoSec }]} numberOfLines={1}>
                        {os.motor}  ·  {os.tipoManutencao}
                      </Text>
                      <Text style={[styles.atividadeData, { color: tema.textoFraco }]}>{os.dataCriacao}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={tema.textoFraco} style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </View>
  );
}

function criarEstilos(t: AppTema) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.fundo },

    hero: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden' },
    heroCirculo:  { position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -80,  right: -60 },
    heroCirculo2: { position: 'absolute', width: 180, height: 180, borderRadius: 90,  bottom: 40, left: -50 },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    heroSaudacaoBox: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    heroPonto: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
    heroSaudacao: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
    heroAcoes: { flexDirection: 'row', gap: 8 },
    heroBtn: {
      width: 36, height: 36, borderRadius: 11,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center', justifyContent: 'center',
    },
    heroBtnSair: { backgroundColor: 'rgba(239,68,68,0.15)' },
    heroNomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    heroNome: { color: '#ffffff', fontSize: 36, fontWeight: '800', letterSpacing: -1 },
    heroLogo: {
      width: 52, height: 52, borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.92)',
    },
    heroEmpresaRow: { flexDirection: 'row', gap: 7, marginBottom: 24 },
    heroEmpresaBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: 'rgba(255,255,255,0.12)',
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    heroEmpresaTexto: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' },

    statsRow: { flexDirection: 'row', gap: 8 },
    statCard: { flex: 1, borderRadius: 14, padding: 12 },
    statTop: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
    statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
    statNum: { fontSize: 26, fontWeight: '800', letterSpacing: -1, lineHeight: 28 },

    corpo: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
    secaoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    secaoTitulo: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3, flexShrink: 0 },
    secaoLinha: { flex: 1, height: 1 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
    gridCard: { width: CARD_W, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
    gridCardTopo: { height: 90, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    gridCirculo: {
      position: 'absolute', width: 100, height: 100, borderRadius: 50,
      backgroundColor: 'rgba(255,255,255,0.08)', top: -30, right: -25,
    },
    gridCardRodape: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 13, paddingVertical: 11, gap: 6,
    },
    gridCardTitulo: { flex: 1, fontSize: 12, fontWeight: '700', lineHeight: 16 },
    gridArrow: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

    atividadeCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    atividadeItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    atividadeDot: { width: 3, borderRadius: 2, alignSelf: 'stretch', minHeight: 44, flexShrink: 0 },
    atividadeTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
    atividadeCliente: { flex: 1, fontSize: 14, fontWeight: '700' },
    statusPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
    statusPillTexto: { fontSize: 9, fontWeight: '700', letterSpacing: 0.2 },
    atividadeDetalhe: { fontSize: 12, marginBottom: 2 },
    atividadeData: { fontSize: 10 },

    vazio: {
      borderRadius: 18, borderWidth: 1, borderStyle: 'dashed',
      overflow: 'hidden', padding: 28, alignItems: 'center', gap: 8,
    },
    vazioIconeBox: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    vazioTitulo: { fontSize: 16, fontWeight: '700' },
    vazioSub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
    vazioBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, marginTop: 8,
    },
    vazioBtnTexto: { color: '#fff', fontSize: 13, fontWeight: '700' },
  });
}
