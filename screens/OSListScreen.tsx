import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl,
  ScrollView, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar } from '../utils/storage';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';
import type { Tecnico } from './TecnicosListScreen';

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
  Aberta: '#d97706', 'Em Andamento': '#2563eb', Concluída: '#16a34a',
};
const STATUS_ICONES: Record<string, string> = {
  Aberta: 'radio-button-on-outline', 'Em Andamento': 'sync-outline', Concluída: 'checkmark-circle-outline',
};
const STATUS_FILTROS = ['Todas', 'Abertas', 'Em Andamento', 'Concluídas'] as const;
type StatusFiltro = typeof STATUS_FILTROS[number];

function parseDateBR(br: string): Date | null {
  const p = br.split('/');
  if (p.length !== 3) return null;
  return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
}

export default function OSListScreen({ onVoltar, onNovaOS, onAbrirOS }: Props) {
  const tema = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);

  const [ordens, setOrdens]       = useState<OrdemServico[]>([]);
  const [tecnicos, setTecnicos]   = useState<Tecnico[]>([]);
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>('Todas');
  const [busca, setBusca]         = useState('');
  const [tecnicoFiltro, setTecnicoFiltro] = useState<string>('');
  const [dataFiltro, setDataFiltro] = useState<'todas' | 'hoje' | 'semana' | 'mes'>('todas');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [recarregando, setRecarregando] = useState(false);

  const carregar_ = useCallback(async () => {
    const [os, tecs] = await Promise.all([
      carregar<OrdemServico[]>('ordensServico'),
      carregar<Tecnico[]>('tecnicos'),
    ]);
    setOrdens(os ?? []);
    setTecnicos(tecs ?? []);
  }, []);

  useEffect(() => { carregar_(); }, [carregar_]);

  async function recarregar() {
    setRecarregando(true);
    await carregar_();
    setRecarregando(false);
  }

  const filtrosAtivos = (busca.trim() ? 1 : 0) + (tecnicoFiltro ? 1 : 0) + (dataFiltro !== 'todas' ? 1 : 0);

  const ordensFiltradas = useMemo(() => {
    let lista = [...ordens].reverse();

    // status
    if (statusFiltro === 'Abertas')     lista = lista.filter((o) => o.status === 'Aberta');
    else if (statusFiltro === 'Em Andamento') lista = lista.filter((o) => o.status === 'Em Andamento');
    else if (statusFiltro === 'Concluídas') lista = lista.filter((o) => o.status === 'Concluída');

    // busca texto (cliente, motor, empresa=cliente, técnico)
    if (busca.trim()) {
      const q = busca.toLowerCase();
      lista = lista.filter((o) =>
        o.cliente.toLowerCase().includes(q) ||
        o.motor.toLowerCase().includes(q) ||
        (o.tecnicoResponsavel ?? '').toLowerCase().includes(q) ||
        o.tipoManutencao.toLowerCase().includes(q)
      );
    }

    // técnico
    if (tecnicoFiltro) {
      lista = lista.filter((o) => o.tecnicoResponsavel === tecnicoFiltro);
    }

    // data
    if (dataFiltro !== 'todas') {
      const agora = new Date();
      lista = lista.filter((o) => {
        const d = parseDateBR(o.dataCriacao);
        if (!d) return false;
        if (dataFiltro === 'hoje') {
          return d.toDateString() === agora.toDateString();
        }
        if (dataFiltro === 'semana') {
          const inicio = new Date(agora); inicio.setDate(agora.getDate() - 7);
          return d >= inicio;
        }
        if (dataFiltro === 'mes') {
          return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
        }
        return true;
      });
    }

    return lista;
  }, [ordens, statusFiltro, busca, tecnicoFiltro, dataFiltro]);

  const contadores = useMemo(() => ({
    Todas: ordens.length,
    Abertas: ordens.filter((o) => o.status === 'Aberta').length,
    'Em Andamento': ordens.filter((o) => o.status === 'Em Andamento').length,
    Concluídas: ordens.filter((o) => o.status === 'Concluída').length,
  }), [ordens]);

  function limparFiltros() {
    setBusca('');
    setTecnicoFiltro('');
    setDataFiltro('todas');
    setMostrarFiltros(false);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={[styles.iconBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Ionicons name="arrow-back" size={20} color={tema.texto} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>Ordens de Serviço</Text>
          <Text style={[styles.subtitulo, { color: tema.textoMuted }]}>{ordens.length} no total</Text>
        </View>
        <TouchableOpacity
          onPress={onNovaOS}
          style={[styles.iconBtn, { backgroundColor: tema.primario, borderColor: tema.primario }]}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Barra de busca */}
      <View style={[styles.buscaBox, { backgroundColor: tema.inputFundo, borderColor: tema.borda }]}>
        <Ionicons name="search-outline" size={16} color={tema.textoMuted} />
        <TextInput
          style={[styles.buscaInput, { color: tema.texto }]}
          placeholder="Buscar cliente, motor, técnico..."
          placeholderTextColor={tema.textoFraco}
          value={busca}
          onChangeText={setBusca}
          autoCapitalize="none"
        />
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca('')}>
            <Ionicons name="close-circle" size={15} color={tema.textoMuted} />
          </TouchableOpacity>
        )}
        <View style={[styles.buscaDivider, { backgroundColor: tema.borda }]} />
        <TouchableOpacity
          onPress={() => setMostrarFiltros(true)}
          style={[styles.filtroBtn, filtrosAtivos > 0 && { backgroundColor: tema.primario + '22' }]}
        >
          <Ionicons name="options-outline" size={16} color={filtrosAtivos > 0 ? tema.primario : tema.textoMuted} />
          {filtrosAtivos > 0 && (
            <View style={[styles.filtroBadge, { backgroundColor: tema.primario }]}>
              <Text style={styles.filtroBadgeTexto}>{filtrosAtivos}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Status chips — compactos */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll} style={styles.chipsScrollWrapper}>
        {STATUS_FILTROS.map((f) => {
          const ativo = statusFiltro === f;
          const cor = f === 'Todas' ? tema.primario : f === 'Abertas' ? '#d97706' : f === 'Em Andamento' ? '#2563eb' : '#16a34a';
          return (
            <TouchableOpacity
              key={f}
              style={[styles.chip, { backgroundColor: ativo ? cor : tema.card, borderColor: ativo ? cor : tema.borda }]}
              onPress={() => setStatusFiltro(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipTexto, { color: ativo ? '#fff' : tema.textoMuted }]}>{f}</Text>
              <View style={[styles.chipCount, { backgroundColor: ativo ? 'rgba(255,255,255,0.25)' : tema.fundo }]}>
                <Text style={[styles.chipCountTexto, { color: ativo ? '#fff' : tema.textoFraco }]}>{contadores[f]}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Filtros ativos pill */}
      {filtrosAtivos > 0 && (
        <TouchableOpacity style={[styles.filtrosAtivosRow, { backgroundColor: tema.primario + '15' }]} onPress={limparFiltros}>
          <Ionicons name="close-circle" size={13} color={tema.primario} />
          <Text style={[styles.filtrosAtivosTexto, { color: tema.primario }]}>
            {filtrosAtivos} filtro{filtrosAtivos > 1 ? 's' : ''} ativo{filtrosAtivos > 1 ? 's' : ''} — toque para limpar
          </Text>
        </TouchableOpacity>
      )}

      {/* Lista */}
      {ordensFiltradas.length === 0 ? (
        <View style={styles.vazio}>
          <View style={[styles.vazioIcone, { backgroundColor: tema.card, borderColor: tema.borda }]}>
            <Ionicons name="document-text-outline" size={32} color={tema.textoFraco} />
          </View>
          <Text style={[styles.vazioTitulo, { color: tema.textoSec }]}>
            {busca || tecnicoFiltro || dataFiltro !== 'todas' || statusFiltro !== 'Todas'
              ? 'Nenhuma OS encontrada'
              : 'Nenhuma OS criada'}
          </Text>
          <Text style={[styles.vazioSub, { color: tema.textoFraco }]}>
            {busca || tecnicoFiltro || dataFiltro !== 'todas'
              ? 'Tente ajustar os filtros.'
              : 'Toque no + para criar a primeira.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={ordensFiltradas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={recarregando} onRefresh={recarregar} tintColor={tema.primario} colors={[tema.primario]} />}
          renderItem={({ item }) => {
            const cor = STATUS_CORES[item.status] ?? '#64748b';
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: tema.card, borderColor: tema.borda }]}
                onPress={() => onAbrirOS(item.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.cardBarra, { backgroundColor: cor }]} />
                <View style={styles.cardCorpo}>
                  <View style={styles.cardLinha1}>
                    <Text style={[styles.cardCliente, { color: tema.texto }]} numberOfLines={1}>{item.cliente}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: cor + '22', borderColor: cor + '55' }]}>
                      <Ionicons name={STATUS_ICONES[item.status] as any} size={9} color={cor} />
                      <Text style={[styles.statusTexto, { color: cor }]}>{item.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.cardMotor, { color: tema.textoSec }]} numberOfLines={1}>
                    {item.motor}  ·  Posição {item.posicao}
                  </Text>
                  <View style={styles.cardLinha3}>
                    <View style={[styles.tipoChip, { backgroundColor: tema.fundo }]}>
                      <Text style={[styles.tipoTexto, { color: tema.textoMuted }]}>{item.tipoManutencao}</Text>
                    </View>
                    <View style={styles.dataRow}>
                      <Ionicons name="calendar-outline" size={10} color={tema.textoFraco} />
                      <Text style={[styles.cardData, { color: tema.textoFraco }]}>{item.dataCriacao}</Text>
                    </View>
                  </View>
                  {!!item.tecnicoResponsavel && (
                    <View style={styles.tecnicoRow}>
                      <Ionicons name="person-outline" size={10} color={tema.textoFraco} />
                      <Text style={[styles.tecnicoTexto, { color: tema.textoFraco }]}>{item.tecnicoResponsavel}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={14} color={tema.textoFraco} style={styles.cardArrow} />
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
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Modal de filtros avançados */}
      <Modal visible={mostrarFiltros} animationType="slide" transparent onRequestClose={() => setMostrarFiltros(false)}>
        <View style={styles.modalFundo}>
          <View style={[styles.modalBox, { backgroundColor: tema.card }]}>
            {/* handle */}
            <View style={[styles.modalHandle, { backgroundColor: tema.borda }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: tema.texto }]}>Filtros Avançados</Text>
              <TouchableOpacity onPress={limparFiltros}>
                <Text style={[styles.modalLimpar, { color: tema.primario }]}>Limpar tudo</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Período */}
              <Text style={[styles.modalSecao, { color: tema.textoMuted }]}>Período de criação</Text>
              <View style={styles.modalChips}>
                {([
                  { id: 'todas', label: 'Todas' },
                  { id: 'hoje',  label: 'Hoje'   },
                  { id: 'semana',label: 'Última semana' },
                  { id: 'mes',   label: 'Este mês' },
                ] as const).map((op) => {
                  const ativo = dataFiltro === op.id;
                  return (
                    <TouchableOpacity
                      key={op.id}
                      style={[styles.modalChip, { borderColor: ativo ? tema.primario : tema.borda, backgroundColor: ativo ? tema.primario + '22' : tema.fundo }]}
                      onPress={() => setDataFiltro(op.id)}
                    >
                      <Text style={[styles.modalChipTexto, { color: ativo ? tema.primario : tema.textoSec }]}>{op.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Técnico */}
              {tecnicos.length > 0 && (
                <>
                  <Text style={[styles.modalSecao, { color: tema.textoMuted }]}>Técnico responsável</Text>
                  <View style={styles.modalChips}>
                    <TouchableOpacity
                      style={[styles.modalChip, { borderColor: !tecnicoFiltro ? tema.primario : tema.borda, backgroundColor: !tecnicoFiltro ? tema.primario + '22' : tema.fundo }]}
                      onPress={() => setTecnicoFiltro('')}
                    >
                      <Text style={[styles.modalChipTexto, { color: !tecnicoFiltro ? tema.primario : tema.textoSec }]}>Todos</Text>
                    </TouchableOpacity>
                    {tecnicos.map((tec) => {
                      const ativo = tecnicoFiltro === tec.nome;
                      return (
                        <TouchableOpacity
                          key={tec.id}
                          style={[styles.modalChip, { borderColor: ativo ? '#9333ea' : tema.borda, backgroundColor: ativo ? '#9333ea22' : tema.fundo }]}
                          onPress={() => setTecnicoFiltro(ativo ? '' : tec.nome)}
                        >
                          <Text style={[styles.modalChipTexto, { color: ativo ? '#9333ea' : tema.textoSec }]}>{tec.nome}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalAplicar, { backgroundColor: tema.primario }]}
              onPress={() => setMostrarFiltros(false)}
            >
              <Text style={styles.modalAplicarTexto}>
                Aplicar · {ordensFiltradas.length} resultado{ordensFiltradas.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function criarEstilos(t: AppTema) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.fundo },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 20, paddingTop: 60, paddingBottom: 14,
    },
    iconBtn: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    titulo: { color: t.texto, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
    subtitulo: { fontSize: 11, marginTop: 1 },
    buscaBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      marginHorizontal: 20, marginBottom: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12,
    },
    buscaInput: { flex: 1, fontSize: 13, paddingVertical: 10 },
    buscaDivider: { width: 1, height: 18 },
    filtroBtn: { padding: 6, borderRadius: 8, position: 'relative' },
    filtroBadge: {
      position: 'absolute', top: 2, right: 2,
      width: 14, height: 14, borderRadius: 7,
      alignItems: 'center', justifyContent: 'center',
    },
    filtroBadgeTexto: { color: '#fff', fontSize: 8, fontWeight: '700' },
    chipsScrollWrapper: { flexGrow: 0, flexShrink: 0 },
    chipsScroll: {
      paddingHorizontal: 20, paddingBottom: 10, gap: 6,
      alignItems: 'center', flexDirection: 'row',
    },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 11, paddingVertical: 6,
      borderRadius: 20, borderWidth: 1,
      alignSelf: 'flex-start',
    },
    chipTexto: { fontSize: 12, fontWeight: '600' },
    chipCount: {
      minWidth: 17, height: 17, borderRadius: 9,
      alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
    },
    chipCountTexto: { fontSize: 9, fontWeight: '700' },
    filtrosAtivosRow: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      marginHorizontal: 20, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    },
    filtrosAtivosTexto: { fontSize: 12, fontWeight: '600' },
    lista: { paddingHorizontal: 20, paddingBottom: 100 },
    card: {
      flexDirection: 'row', alignItems: 'center', borderRadius: 13, borderWidth: 1,
      marginBottom: 8, overflow: 'hidden',
    },
    cardBarra: { width: 3, alignSelf: 'stretch' },
    cardCorpo: { flex: 1, padding: 12 },
    cardLinha1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    cardCliente: { fontSize: 14, fontWeight: '700', flex: 1, letterSpacing: -0.2 },
    statusBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, borderWidth: 1, marginLeft: 6,
    },
    statusTexto: { fontSize: 9, fontWeight: '700' },
    cardMotor: { fontSize: 11, marginBottom: 6 },
    cardLinha3: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tipoChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
    tipoTexto: { fontSize: 10, fontWeight: '500' },
    dataRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    cardData: { fontSize: 10 },
    tecnicoRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 },
    tecnicoTexto: { fontSize: 10 },
    cardArrow: { paddingHorizontal: 8 },
    vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 8 },
    vazioIcone: { width: 64, height: 64, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    vazioTitulo: { fontSize: 15, fontWeight: '700' },
    vazioSub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
    fab: {
      position: 'absolute', right: 20, bottom: 30,
      width: 54, height: 54, borderRadius: 27,
      alignItems: 'center', justifyContent: 'center',
      shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    // Modal filtros
    modalFundo: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
    modalBox: {
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 20, paddingBottom: 36, maxHeight: '80%',
    },
    modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitulo: { fontSize: 17, fontWeight: '800' },
    modalLimpar: { fontSize: 13, fontWeight: '600' },
    modalSecao: {
      fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
      letterSpacing: 0.8, marginBottom: 10, marginTop: 4,
    },
    modalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    modalChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
    modalChipTexto: { fontSize: 13, fontWeight: '600' },
    modalAplicar: {
      borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 10,
    },
    modalAplicarTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },
  });
}
