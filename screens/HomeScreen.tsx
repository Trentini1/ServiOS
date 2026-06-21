import { useRef, useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar } from '../utils/storage';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';
import type { OrdemServico } from './OSListScreen';
import type { Cliente } from './ClientListScreen';

type Empresa = {
  nome: string; cnpj: string; telefone: string;
  segmento: string; cidade: string; estado: string;
};

type Resumo = { osAbertas: number; clientes: number; osConcluidas: number };

type Props = {
  usuario: string;
  empresa: Empresa;
  onSair: () => void;
  onAbrirMenu: (id: string) => void;
  onAbrirConfiguracoes: () => void;
};

const MENU = [
  { id: 'os', titulo: 'Ordens de Serviço', icone: 'document-text-outline', cor: '#2563eb' },
  { id: 'clientes', titulo: 'Clientes', icone: 'people-outline', cor: '#16a34a' },
  { id: 'agenda', titulo: 'Agenda', icone: 'calendar-outline', cor: '#d97706' },
  { id: 'relatorios', titulo: 'Relatórios', icone: 'bar-chart-outline', cor: '#9333ea' },
  { id: 'tecnicos', titulo: 'Técnicos', icone: 'construct-outline', cor: '#0891b2' },
] as const;

export default function HomeScreen({ usuario, empresa, onSair, onAbrirMenu, onAbrirConfiguracoes }: Props) {
  const tema = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const [resumo, setResumo] = useState<Resumo>({ osAbertas: 0, clientes: 0, osConcluidas: 0 });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    async function carregarResumo() {
      const ordens = (await carregar<OrdemServico[]>('ordensServico')) ?? [];
      const clientes = (await carregar<Cliente[]>('clientes')) ?? [];
      const hoje = new Date().toISOString().split('T')[0];
      setResumo({
        osAbertas: ordens.filter((o) => o.status === 'Aberta' || o.status === 'Em Andamento').length,
        clientes: clientes.length,
        osConcluidas: ordens.filter((o) => o.dataAgendada && o.dataAgendada >= hoje).length,
      });
    }
    carregarResumo();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.saudacao}>Olá, {usuario.split(' ')[0]} 👋</Text>
            <Text style={styles.empresaNome}>{empresa.nome}</Text>
          </View>
          <View style={styles.headerBotoes}>
            <TouchableOpacity style={styles.headerBtn} onPress={onAbrirConfiguracoes} activeOpacity={0.8}>
              <Ionicons name="settings-outline" size={20} color={tema.textoSec} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerBtn, styles.sairBtn]} onPress={onSair} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={20} color="#f87171" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.resumoCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.resumoItem}>
            <Text style={[styles.resumoNumero, { color: tema.primario }]}>{resumo.osAbertas}</Text>
            <Text style={styles.resumoLabel}>OS abertas</Text>
          </View>
          <View style={[styles.resumoDivisor, { backgroundColor: tema.borda }]} />
          <View style={styles.resumoItem}>
            <Text style={[styles.resumoNumero, { color: tema.primario }]}>{resumo.clientes}</Text>
            <Text style={styles.resumoLabel}>Clientes</Text>
          </View>
          <View style={[styles.resumoDivisor, { backgroundColor: tema.borda }]} />
          <View style={styles.resumoItem}>
            <Text style={[styles.resumoNumero, { color: tema.primario }]}>{resumo.osConcluidas}</Text>
            <Text style={styles.resumoLabel}>Agendadas</Text>
          </View>
        </Animated.View>

        <Text style={styles.secaoTitulo}>Acesso rápido</Text>

        <Animated.View style={[styles.grid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {MENU.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              onPress={() => onAbrirMenu(item.id)}
              activeOpacity={0.85}
            >
              <View style={[styles.menuIcone, { backgroundColor: item.cor + '22' }]}>
                <Ionicons name={item.icone as any} size={24} color={item.cor} />
              </View>
              <Text style={styles.menuTitulo}>{item.titulo}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function criarEstilos(t: AppTema) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.fundo },
    scrollContent: { padding: 24, paddingTop: 60 },
    header: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 24,
    },
    saudacao: { color: t.textoSec, fontSize: 14 },
    empresaNome: { color: t.texto, fontSize: 22, fontWeight: '700', marginTop: 2 },
    headerBotoes: { flexDirection: 'row', gap: 8 },
    headerBtn: {
      width: 42, height: 42, borderRadius: 12,
      backgroundColor: t.card, borderWidth: 1, borderColor: t.borda,
      alignItems: 'center', justifyContent: 'center',
    },
    sairBtn: {},
    resumoCard: {
      flexDirection: 'row', backgroundColor: t.card,
      borderRadius: 16, padding: 18, borderWidth: 1, borderColor: t.borda, marginBottom: 28,
    },
    resumoItem: { flex: 1, alignItems: 'center' },
    resumoNumero: { fontSize: 24, fontWeight: '700' },
    resumoLabel: { color: t.textoMuted, fontSize: 12, marginTop: 4 },
    resumoDivisor: { width: 1 },
    secaoTitulo: { color: t.texto, fontSize: 16, fontWeight: '600', marginBottom: 14 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    menuCard: {
      width: '47%', backgroundColor: t.card,
      borderRadius: 16, padding: 18, borderWidth: 1, borderColor: t.borda,
    },
    menuIcone: {
      width: 44, height: 44, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    menuTitulo: { color: t.texto, fontSize: 14, fontWeight: '600' },
  });
}
