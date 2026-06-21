import { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { carregar } from '../utils/storage';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';
import type { OrdemServico } from './OSListScreen';
import type { Cliente } from './ClientListScreen';

type Empresa = {
  nome: string; cnpj?: string; telefone?: string;
  segmento?: string; cidade?: string; estado?: string;
};

type Props = {
  usuario: string;
  empresa: Empresa;
  onSair: () => void;
  onAbrirMenu: (id: string) => void;
  onAbrirConfiguracoes: () => void;
};

const MENU = [
  { id: 'os',          titulo: 'Ordens de Serviço', icone: 'document-text',  cor: '#2563eb' },
  { id: 'clientes',    titulo: 'Clientes',           icone: 'people',         cor: '#16a34a' },
  { id: 'agenda',      titulo: 'Agenda',              icone: 'calendar',       cor: '#d97706' },
  { id: 'relatorios',  titulo: 'Relatórios',          icone: 'bar-chart',      cor: '#9333ea' },
  { id: 'tecnicos',    titulo: 'Técnicos',            icone: 'construct',      cor: '#0891b2' },
  { id: 'assinaturas', titulo: 'Assinaturas',         icone: 'create',         cor: '#db2777' },
] as const;

const CORES_STATUS: Record<string, string> = {
  Aberta: '#d97706', 'Em Andamento': '#2563eb', Concluída: '#16a34a',
};

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HomeScreen({ usuario, empresa, onSair, onAbrirMenu, onAbrirConfiguracoes }: Props) {
  const tema = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [osAbertas, setOsAbertas]   = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [agendadas, setAgendadas]   = useState(0);
  const [recentes, setRecentes]     = useState<OrdemServico[]>([]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    (async () => {
      const [os, cls] = await Promise.all([
        carregar<OrdemServico[]>('ordensServico'),
        carregar<Cliente[]>('clientes'),
      ]);
      const ordens = os ?? [];
      const hoje   = new Date().toISOString().split('T')[0];
      setOsAbertas(ordens.filter((o) => o.status === 'Aberta' || o.status === 'Em Andamento').length);
      setTotalClientes((cls ?? []).length);
      setAgendadas(ordens.filter((o) => o.dataAgendada && o.dataAgendada >= hoje).length);
      setRecentes([...ordens].reverse().slice(0, 3));
    })();
  }, []);

  const primeiroNome = usuario.split(' ')[0];

  return (
    <View style={styles.container}>
      {/* Gradiente sutil de fundo no topo */}
      <LinearGradient
        colors={[tema.primario + '28', tema.fundo + '00'] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.saudacao}>{saudacao()}</Text>
              <Text style={styles.nomeUsuario}>{primeiroNome}</Text>
              <View style={styles.empresaRow}>
                <View style={[styles.empresaBadge, { backgroundColor: tema.primario + '22', borderColor: tema.primario + '44' }]}>
                  <Ionicons name="business" size={10} color={tema.primario} />
                  <Text style={[styles.empresaBadgeTexto, { color: tema.primario }]} numberOfLines={1}>
                    {empresa.nome}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.headerAcoes}>
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}
                onPress={onAbrirConfiguracoes}
                activeOpacity={0.8}
              >
                <Ionicons name="settings-outline" size={19} color={tema.textoSec} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerBtn, styles.sairBtn]}
                onPress={onSair}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={19} color="#f87171" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Stats ── */}
          <View style={styles.statsRow}>
            {[
              { label: 'OS Abertas',  valor: osAbertas,     icone: 'document-text-outline', cor: tema.primario },
              { label: 'Clientes',    valor: totalClientes,  icone: 'people-outline',         cor: '#16a34a'    },
              { label: 'Agendadas',   valor: agendadas,      icone: 'calendar-outline',       cor: '#d97706'    },
            ].map((s) => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: tema.card, borderColor: tema.borda }]}>
                <View style={[styles.statFaixa, { backgroundColor: s.cor }]} />
                <View style={styles.statBody}>
                  <Text style={[styles.statNum, { color: s.cor }]}>{s.valor}</Text>
                  <Text style={[styles.statLabel, { color: tema.textoMuted }]}>{s.label}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── Acesso Rápido ── */}
          <View style={styles.secaoHeader}>
            <Text style={[styles.secaoTitulo, { color: tema.texto }]}>Acesso Rápido</Text>
          </View>
          <View style={styles.grid}>
            {MENU.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuCard, { backgroundColor: tema.card, borderColor: tema.borda }]}
                onPress={() => onAbrirMenu(item.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconeBox, { backgroundColor: item.cor + '1a' }]}>
                  <Ionicons name={item.icone as any} size={22} color={item.cor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitulo, { color: tema.texto }]}>{item.titulo}</Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={tema.textoFraco} />
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Últimas Ordens ── */}
          {recentes.length > 0 && (
            <View>
              <View style={styles.secaoHeader}>
                <Text style={[styles.secaoTitulo, { color: tema.texto }]}>Últimas Ordens</Text>
              </View>
              {recentes.map((os) => {
                const cor = CORES_STATUS[os.status] ?? '#64748b';
                return (
                  <View key={os.id} style={[styles.osCard, { backgroundColor: tema.card, borderColor: tema.borda }]}>
                    <View style={[styles.osStatusBarra, { backgroundColor: cor }]} />
                    <View style={styles.osCorpo}>
                      <View style={styles.osTopRow}>
                        <Text style={[styles.osCliente, { color: tema.texto }]} numberOfLines={1}>
                          {os.cliente}
                        </Text>
                        <View style={[styles.osBadge, { backgroundColor: cor + '22' }]}>
                          <Text style={[styles.osBadgeTexto, { color: cor }]}>{os.status}</Text>
                        </View>
                      </View>
                      <Text style={[styles.osDetalhe, { color: tema.textoSec }]} numberOfLines={1}>
                        {os.motor}  ·  {os.tipoManutencao}
                      </Text>
                      <Text style={[styles.osData, { color: tema.textoFraco }]}>{os.dataCriacao}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {recentes.length === 0 && (
            <View style={[styles.emptyOS, { backgroundColor: tema.card, borderColor: tema.borda }]}>
              <Ionicons name="document-text-outline" size={32} color={tema.textoFraco} />
              <Text style={[styles.emptyOSTitulo, { color: tema.textoSec }]}>Nenhuma OS ainda</Text>
              <Text style={[styles.emptyOSSub, { color: tema.textoFraco }]}>
                Toque em Ordens de Serviço para criar a primeira.
              </Text>
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
    scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 48 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
    saudacao: { color: t.textoMuted, fontSize: 13, fontWeight: '500' },
    nomeUsuario: { color: t.texto, fontSize: 30, fontWeight: '800', letterSpacing: -0.8, marginTop: 1 },
    empresaRow: { flexDirection: 'row', marginTop: 6 },
    empresaBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, maxWidth: 220,
    },
    empresaBadgeTexto: { fontSize: 11, fontWeight: '600' },
    headerAcoes: { flexDirection: 'row', gap: 8, paddingTop: 4 },
    headerBtn: {
      width: 40, height: 40, borderRadius: 12, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center',
    },
    sairBtn: { backgroundColor: '#f8717110', borderColor: '#f8717133' },

    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
    statCard: {
      flex: 1, borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    },
    statFaixa: { height: 3 },
    statBody: { padding: 14 },
    statNum: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
    statLabel: { fontSize: 10, fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.3 },

    secaoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 13 },
    secaoTitulo: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
    menuCard: {
      width: '48%', borderRadius: 14, padding: 14, borderWidth: 1,
      flexDirection: 'row', alignItems: 'center', gap: 11,
    },
    menuIconeBox: {
      width: 38, height: 38, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    menuTitulo: { fontSize: 12, fontWeight: '600', lineHeight: 17 },

    osCard: {
      flexDirection: 'row', borderRadius: 13, borderWidth: 1,
      marginBottom: 10, overflow: 'hidden',
    },
    osStatusBarra: { width: 3 },
    osCorpo: { flex: 1, padding: 13 },
    osTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    osCliente: { fontSize: 14, fontWeight: '700', flex: 1 },
    osBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 8 },
    osBadgeTexto: { fontSize: 10, fontWeight: '700' },
    osDetalhe: { fontSize: 12, marginBottom: 4 },
    osData: { fontSize: 11 },

    emptyOS: {
      alignItems: 'center', padding: 28, borderRadius: 14, borderWidth: 1,
      borderStyle: 'dashed', gap: 8,
    },
    emptyOSTitulo: { fontSize: 15, fontWeight: '600' },
    emptyOSSub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  });
}
