import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar } from '../utils/storage';
import type { OrdemServico } from './OSListScreen';
import type { Cliente } from './ClientListScreen';

type Props = {
  onVoltar: () => void;
};

const CORES_STATUS: Record<string, string> = {
  Aberta: '#d97706',
  'Em Andamento': '#2563eb',
  Concluída: '#16a34a',
};

const FILTROS = ['Este mês', 'Últimos 3 meses', 'Este ano', 'Tudo'] as const;
type Filtro = (typeof FILTROS)[number];

function parseDateBR(dataBR: string): Date | null {
  const partes = dataBR.split('/');
  if (partes.length !== 3) return null;
  return new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
}

function filtrarPorPeriodo(ordens: OrdemServico[], filtro: Filtro): OrdemServico[] {
  if (filtro === 'Tudo') return ordens;
  const agora = new Date();
  const limites: Record<Exclude<Filtro, 'Tudo'>, Date> = {
    'Este mês': new Date(agora.getFullYear(), agora.getMonth(), 1),
    'Últimos 3 meses': new Date(agora.getFullYear(), agora.getMonth() - 2, 1),
    'Este ano': new Date(agora.getFullYear(), 0, 1),
  };
  const limite = limites[filtro as Exclude<Filtro, 'Tudo'>];
  return ordens.filter((o) => {
    const d = parseDateBR(o.dataCriacao);
    return d && d >= limite;
  });
}

function BarraProgresso({ valor, total, cor }: { valor: number; total: number; cor: string }) {
  const pct = total === 0 ? 0 : Math.round((valor / total) * 100);
  return (
    <View style={barraStyles.container}>
      <View style={[barraStyles.fundo]}>
        <View style={[barraStyles.preenchimento, { width: `${pct}%`, backgroundColor: cor }]} />
      </View>
      <Text style={[barraStyles.pct, { color: cor }]}>{pct}%</Text>
    </View>
  );
}

const barraStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  fundo: {
    flex: 1, height: 6, borderRadius: 3, backgroundColor: '#1f2937', overflow: 'hidden',
  },
  preenchimento: { height: '100%', borderRadius: 3 },
  pct: { fontSize: 11, fontWeight: '700', minWidth: 32, textAlign: 'right' },
});

export default function RelatoriosScreen({ onVoltar }: Props) {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('Este mês');
  const [recarregando, setRecarregando] = useState(false);

  const carregar_ = useCallback(async () => {
    const [os, cls] = await Promise.all([
      carregar<OrdemServico[]>('ordensServico'),
      carregar<Cliente[]>('clientes'),
    ]);
    setOrdens(os ?? []);
    setClientes(cls ?? []);
  }, []);

  useEffect(() => { carregar_(); }, [carregar_]);

  async function recarregar() {
    setRecarregando(true);
    await carregar_();
    setRecarregando(false);
  }

  const ordensFiltradas = filtrarPorPeriodo(ordens, filtro);
  const total = ordensFiltradas.length;

  const porStatus = {
    Aberta: ordensFiltradas.filter((o) => o.status === 'Aberta').length,
    'Em Andamento': ordensFiltradas.filter((o) => o.status === 'Em Andamento').length,
    Concluída: ordensFiltradas.filter((o) => o.status === 'Concluída').length,
  };

  const tiposUnicos = [...new Set(ordensFiltradas.map((o) => o.tipoManutencao))].filter(Boolean);
  const porTipo = tiposUnicos
    .map((t) => ({ tipo: t, qty: ordensFiltradas.filter((o) => o.tipoManutencao === t).length }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const porCliente = clientes
    .map((c) => ({
      nome: c.nome,
      qty: ordensFiltradas.filter((o) => o.cliente === c.nome).length,
    }))
    .filter((c) => c.qty > 0)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={styles.voltarBotao}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Relatórios</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={recarregando}
            onRefresh={recarregar}
            tintColor="#2563eb"
            colors={['#2563eb']}
          />
        }
      >
        {/* Filtro de período */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtrosRow}
        >
          {FILTROS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filtroChip, filtro === f && styles.filtroChipAtivo]}
              onPress={() => setFiltro(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filtroTexto, filtro === f && styles.filtroTextoAtivo]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Cards de resumo */}
        <View style={styles.resumoGrid}>
          <View style={[styles.resumoCard, { borderColor: '#2563eb44' }]}>
            <Text style={[styles.resumoNum, { color: '#2563eb' }]}>{total}</Text>
            <Text style={styles.resumoLabel}>Total de OS</Text>
          </View>
          <View style={[styles.resumoCard, { borderColor: '#16a34a44' }]}>
            <Text style={[styles.resumoNum, { color: '#16a34a' }]}>{porStatus.Concluída}</Text>
            <Text style={styles.resumoLabel}>Concluídas</Text>
          </View>
          <View style={[styles.resumoCard, { borderColor: '#d9770644' }]}>
            <Text style={[styles.resumoNum, { color: '#d97706' }]}>{porStatus.Aberta}</Text>
            <Text style={styles.resumoLabel}>Abertas</Text>
          </View>
          <View style={[styles.resumoCard, { borderColor: '#9333ea44' }]}>
            <Text style={[styles.resumoNum, { color: '#9333ea' }]}>{clientes.length}</Text>
            <Text style={styles.resumoLabel}>Clientes</Text>
          </View>
        </View>

        {/* Por status */}
        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>Por status</Text>
          {Object.entries(porStatus).map(([status, qty]) => (
            <View key={status} style={styles.linhaItem}>
              <View style={styles.linhaEsq}>
                <View style={[styles.dot, { backgroundColor: CORES_STATUS[status] }]} />
                <Text style={styles.linhaLabel}>{status}</Text>
              </View>
              <Text style={styles.linhaQty}>{qty}</Text>
              <View style={{ flex: 1 }}>
                <BarraProgresso valor={qty} total={total} cor={CORES_STATUS[status]} />
              </View>
            </View>
          ))}
          {total === 0 && <Text style={styles.semDados}>Sem dados no período</Text>}
        </View>

        {/* Por tipo de manutenção */}
        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>Por tipo de manutenção</Text>
          {porTipo.length === 0 && <Text style={styles.semDados}>Sem dados no período</Text>}
          {porTipo.map(({ tipo, qty }) => (
            <View key={tipo} style={styles.linhaItem}>
              <View style={styles.linhaEsq}>
                <Ionicons name="construct-outline" size={13} color="#64748b" />
                <Text style={styles.linhaLabel}>{tipo}</Text>
              </View>
              <Text style={styles.linhaQty}>{qty}</Text>
              <View style={{ flex: 1 }}>
                <BarraProgresso valor={qty} total={total} cor="#9333ea" />
              </View>
            </View>
          ))}
        </View>

        {/* Por cliente */}
        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>Por cliente (top 5)</Text>
          {porCliente.length === 0 && <Text style={styles.semDados}>Sem dados no período</Text>}
          {porCliente.map(({ nome, qty }) => (
            <View key={nome} style={styles.linhaItem}>
              <View style={styles.linhaEsq}>
                <Ionicons name="business-outline" size={13} color="#64748b" />
                <Text style={styles.linhaLabel} numberOfLines={1}>{nome}</Text>
              </View>
              <Text style={styles.linhaQty}>{qty}</Text>
              <View style={{ flex: 1 }}>
                <BarraProgresso valor={qty} total={total} cor="#2563eb" />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
  },
  voltarBotao: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#111827',
    borderWidth: 1, borderColor: '#1f2937', alignItems: 'center', justifyContent: 'center',
  },
  titulo: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 40 },
  filtrosRow: { gap: 8, paddingBottom: 16 },
  filtroChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937',
  },
  filtroChipAtivo: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filtroTexto: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  filtroTextoAtivo: { color: '#ffffff' },
  resumoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  resumoCard: {
    flex: 1, minWidth: '44%', backgroundColor: '#111827', borderRadius: 14,
    padding: 16, borderWidth: 1,
  },
  resumoNum: { fontSize: 28, fontWeight: '700' },
  resumoLabel: { color: '#64748b', fontSize: 12, marginTop: 4 },
  card: {
    backgroundColor: '#111827', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#1f2937', marginBottom: 14,
  },
  secaoTitulo: {
    color: '#94a3b8', fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14,
  },
  linhaItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 10, flexWrap: 'wrap',
  },
  linhaEsq: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 100, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  linhaLabel: { color: '#e2e8f0', fontSize: 13, flex: 1 },
  linhaQty: { color: '#94a3b8', fontSize: 13, fontWeight: '700', minWidth: 20, textAlign: 'right' },
  semDados: { color: '#475569', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
});
