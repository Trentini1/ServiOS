import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar } from '../utils/storage';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';

export type PeriodoTrabalho = { entrada: string; saida: string };
export type DiaExecucao = { data: string; periodos: PeriodoTrabalho[] };
export type PecaUtilizada = {
  id: string; descricao: string; quantidade: string; unidade: string; fornecedor: string;
};

export type OrdemServico = {
  id: string;
  cliente: string;
  clienteTelefone?: string;
  motor: string;
  posicao: string;
  tipoManutencao: string;
  descricao: string;
  status: 'Aberta' | 'Em Andamento' | 'Concluída';
  dataCriacao: string;
  dataAgendada?: string;
  tecnicoResponsavel?: string;
  diasExecucao?: DiaExecucao[];
  pecas?: PecaUtilizada[];
  fotos?: string[];
  assinaturaTecnico?: string;
  assinaturaCliente?: string;
  temaPdfId?: string;
};

type Props = {
  onVoltar: () => void;
  onNovaOS: () => void;
  onAbrirOS: (id: string) => void;
};

const STATUS_CORES: Record<string, string> = {
  Aberta: '#d97706',
  'Em Andamento': '#2563eb',
  Concluída: '#16a34a',
};

const STATUS_ICONES: Record<string, string> = {
  Aberta: 'radio-button-on-outline',
  'Em Andamento': 'sync-outline',
  Concluída: 'checkmark-circle-outline',
};

const FILTROS = ['Todas', 'Abertas', 'Em Andamento', 'Concluídas'] as const;
type Filtro = typeof FILTROS[number];

export default function OSListScreen({ onVoltar, onNovaOS, onAbrirOS }: Props) {
  const tema = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('Todas');
  const [recarregando, setRecarregando] = useState(false);

  const carregarOrdens = useCallback(async () => {
    const lista = await carregar<OrdemServico[]>('ordensServico');
    setOrdens(lista ?? []);
  }, []);

  useEffect(() => { carregarOrdens(); }, [carregarOrdens]);

  async function recarregar() {
    setRecarregando(true);
    await carregarOrdens();
    setRecarregando(false);
  }

  const ordensFiltradas = useMemo(() => {
    const lista = [...ordens].reverse();
    if (filtro === 'Todas') return lista;
    if (filtro === 'Abertas') return lista.filter((o) => o.status === 'Aberta');
    if (filtro === 'Em Andamento') return lista.filter((o) => o.status === 'Em Andamento');
    return lista.filter((o) => o.status === 'Concluída');
  }, [ordens, filtro]);

  const contadores = useMemo(() => ({
    Todas: ordens.length,
    Abertas: ordens.filter((o) => o.status === 'Aberta').length,
    'Em Andamento': ordens.filter((o) => o.status === 'Em Andamento').length,
    Concluídas: ordens.filter((o) => o.status === 'Concluída').length,
  }), [ordens]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={[styles.iconBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Ionicons name="arrow-back" size={20} color={tema.texto} />
        </TouchableOpacity>
        <View>
          <Text style={styles.titulo}>Ordens de Serviço</Text>
          <Text style={[styles.subtitulo, { color: tema.textoMuted }]}>{ordens.length} ordens no total</Text>
        </View>
        <TouchableOpacity
          onPress={onNovaOS}
          style={[styles.novaOSBtn, { backgroundColor: tema.primario }]}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtrosScroll}
      >
        {FILTROS.map((f) => {
          const ativo = filtro === f;
          const cor = f === 'Todas' ? tema.primario
            : f === 'Abertas' ? '#d97706'
            : f === 'Em Andamento' ? '#2563eb'
            : '#16a34a';
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filtroChip, {
                backgroundColor: ativo ? cor + '22' : tema.card,
                borderColor: ativo ? cor + '66' : tema.borda,
              }]}
              onPress={() => setFiltro(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filtroTexto, { color: ativo ? cor : tema.textoMuted }]}>{f}</Text>
              <View style={[styles.filtroContador, { backgroundColor: ativo ? cor : tema.borda }]}>
                <Text style={[styles.filtroContadorTexto, { color: ativo ? '#ffffff' : tema.textoFraco }]}>
                  {contadores[f]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Lista */}
      {ordensFiltradas.length === 0 ? (
        <View style={styles.vazio}>
          <View style={[styles.vazioIcone, { backgroundColor: tema.card, borderColor: tema.borda }]}>
            <Ionicons name="document-text-outline" size={36} color={tema.textoFraco} />
          </View>
          <Text style={[styles.vazioTitulo, { color: tema.textoSec }]}>
            {filtro === 'Todas' ? 'Nenhuma OS criada' : `Nenhuma OS ${filtro.toLowerCase()}`}
          </Text>
          <Text style={[styles.vazioSub, { color: tema.textoFraco }]}>
            {filtro === 'Todas' ? 'Toque no + para criar a primeira ordem de serviço.' : 'Tente outro filtro.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={ordensFiltradas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl
              refreshing={recarregando}
              onRefresh={recarregar}
              tintColor={tema.primario}
              colors={[tema.primario]}
            />
          }
          renderItem={({ item }) => {
            const cor = STATUS_CORES[item.status] ?? '#64748b';
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: tema.card, borderColor: tema.borda }]}
                onPress={() => onAbrirOS(item.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.cardStatusBarra, { backgroundColor: cor }]} />
                <View style={styles.cardCorpo}>
                  {/* Linha 1: cliente + badge */}
                  <View style={styles.cardLinha1}>
                    <Text style={[styles.cardCliente, { color: tema.texto }]} numberOfLines={1}>
                      {item.cliente}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: cor + '22', borderColor: cor + '55' }]}>
                      <Ionicons name={STATUS_ICONES[item.status] as any} size={10} color={cor} />
                      <Text style={[styles.statusTexto, { color: cor }]}>{item.status}</Text>
                    </View>
                  </View>
                  {/* Linha 2: motor + posição */}
                  <Text style={[styles.cardMotor, { color: tema.textoSec }]} numberOfLines={1}>
                    {item.motor}  ·  Posição {item.posicao}
                  </Text>
                  {/* Linha 3: tipo + data */}
                  <View style={styles.cardLinha3}>
                    <View style={[styles.tipoChip, { backgroundColor: tema.fundo }]}>
                      <Text style={[styles.tipoTexto, { color: tema.textoMuted }]}>{item.tipoManutencao}</Text>
                    </View>
                    <View style={styles.dataRow}>
                      <Ionicons name="calendar-outline" size={11} color={tema.textoFraco} />
                      <Text style={[styles.cardData, { color: tema.textoFraco }]}>{item.dataCriacao}</Text>
                    </View>
                  </View>
                  {/* Técnico (se houver) */}
                  {!!item.tecnicoResponsavel && (
                    <View style={styles.tecnicoRow}>
                      <Ionicons name="person-outline" size={11} color={tema.textoFraco} />
                      <Text style={[styles.tecnicoTexto, { color: tema.textoFraco }]}>{item.tecnicoResponsavel}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={tema.textoFraco} style={styles.cardArrow} />
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: tema.primario, shadowColor: tema.primario }]}
        onPress={onNovaOS}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

function criarEstilos(t: AppTema) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.fundo },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    },
    iconBtn: {
      width: 40, height: 40, borderRadius: 12, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    titulo: { color: t.texto, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
    subtitulo: { fontSize: 12, marginTop: 1 },
    novaOSBtn: {
      width: 40, height: 40, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center',
      marginLeft: 'auto', flexShrink: 0,
      shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    filtrosScroll: { paddingHorizontal: 20, paddingBottom: 14, gap: 8 },
    filtroChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
    },
    filtroTexto: { fontSize: 13, fontWeight: '600' },
    filtroContador: {
      minWidth: 18, height: 18, borderRadius: 9,
      alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    },
    filtroContadorTexto: { fontSize: 10, fontWeight: '700' },
    lista: { paddingHorizontal: 20, paddingBottom: 100 },
    card: {
      flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1,
      marginBottom: 10, overflow: 'hidden',
    },
    cardStatusBarra: { width: 4, alignSelf: 'stretch' },
    cardCorpo: { flex: 1, padding: 14 },
    cardLinha1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    cardCliente: { fontSize: 15, fontWeight: '700', flex: 1, letterSpacing: -0.2 },
    statusBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, marginLeft: 8,
    },
    statusTexto: { fontSize: 10, fontWeight: '700' },
    cardMotor: { fontSize: 12, marginBottom: 8 },
    cardLinha3: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tipoChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    tipoTexto: { fontSize: 11, fontWeight: '500' },
    dataRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardData: { fontSize: 11 },
    tecnicoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    tecnicoTexto: { fontSize: 11 },
    cardArrow: { paddingHorizontal: 10 },
    vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10 },
    vazioIcone: {
      width: 72, height: 72, borderRadius: 20, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    },
    vazioTitulo: { fontSize: 16, fontWeight: '700' },
    vazioSub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
    fab: {
      position: 'absolute', right: 20, bottom: 30,
      width: 56, height: 56, borderRadius: 28,
      alignItems: 'center', justifyContent: 'center',
      shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
  });
}
