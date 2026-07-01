import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  RefreshControl, Modal, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { carregar, salvar, listarOS } from '../utils/cloudStorage';
import type { OrdemServico } from './OSListScreen';
import type { Tecnico } from './TecnicosListScreen';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';

LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
  dayNames: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  today: 'Hoje',
};
LocaleConfig.defaultLocale = 'pt-br';

export type Agendamento = {
  id: string;
  titulo: string;
  data: string;        // YYYY-MM-DD
  horario?: string;    // HH:MM
  cliente?: string;
  tecnico?: string;
  observacao?: string;
};

const CORES_STATUS: Record<string, string> = {
  Aberta: '#d97706', 'Em Andamento': '#2563eb', Concluída: '#16a34a',
};
const COR_AGENDAMENTO = '#db2777';

function brParaISO(dataBR: string): string | null {
  const p = dataBR.split('/');
  if (p.length !== 3 || p[2].length !== 4) return null;
  return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
}

function dataCalendario(os: OrdemServico): string | null {
  if (os.dataAgendada) return os.dataAgendada;
  return brParaISO(os.dataCriacao);
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  const d = new Date(Number(ano), Number(mes) - 1, Number(dia));
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatarHorario(v: string): string {
  const n = v.replace(/\D/g, '').slice(0, 4);
  if (n.length <= 2) return n;
  return `${n.slice(0, 2)}:${n.slice(2)}`;
}

type Props = {
  uid: string;
  onVoltar: () => void;
  onAbrirOS: (id: string) => void;
};

type ItemLista =
  | { tipo: 'os';          os: OrdemServico    }
  | { tipo: 'agendamento'; ag: Agendamento     };

export default function AgendaScreen({ uid, onVoltar, onAbrirOS }: Props) {
  const tema   = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);
  const hoje   = new Date().toISOString().split('T')[0];

  const [dataSelecionada, setDataSelecionada] = useState(hoje);
  const [ordens, setOrdens]           = useState<OrdemServico[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [tecnicos, setTecnicos]       = useState<Tecnico[]>([]);
  const [carregando, setCarregando]   = useState(true);
  const [recarregando, setRecarregando] = useState(false);

  // Modal novo agendamento
  const [modalAberto, setModalAberto] = useState(false);
  const [titulo, setTitulo]         = useState('');
  const [horario, setHorario]       = useState('');
  const [cliente, setCliente]       = useState('');
  const [tecnicoSel, setTecnicoSel] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando]     = useState(false);

  const carregar_ = useCallback(async () => {
    const [os, ags, tecs] = await Promise.all([
      listarOS(uid),
      carregar<Agendamento[]>('agendamentos'),
      carregar<Tecnico[]>('tecnicos'),
    ]);
    setOrdens(os);
    setAgendamentos(ags ?? []);
    setTecnicos(tecs ?? []);
  }, [uid]);

  useEffect(() => { carregar_().then(() => setCarregando(false)); }, [carregar_]);

  async function recarregar() {
    setRecarregando(true);
    await carregar_();
    setRecarregando(false);
  }

  function abrirModal() {
    setTitulo(''); setHorario(''); setCliente('');
    setTecnicoSel(''); setObservacao('');
    setModalAberto(true);
  }

  async function salvarAgendamento() {
    if (!titulo.trim()) { Alert.alert('Atenção', 'Digite um título para o agendamento.'); return; }
    setSalvando(true);
    const novo: Agendamento = {
      id: Date.now().toString(),
      titulo: titulo.trim(),
      data: dataSelecionada,
      horario: horario || undefined,
      cliente: cliente.trim() || undefined,
      tecnico: tecnicoSel || undefined,
      observacao: observacao.trim() || undefined,
    };
    const lista = [...agendamentos, novo];
    await salvar('agendamentos', lista);
    setAgendamentos(lista);
    setSalvando(false);
    setModalAberto(false);
  }

  async function excluirAgendamento(id: string) {
    Alert.alert('Excluir', 'Remover este agendamento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          const lista = agendamentos.filter((a) => a.id !== id);
          await salvar('agendamentos', lista);
          setAgendamentos(lista);
        },
      },
    ]);
  }

  const marcadores = useMemo(() => {
    const acc: Record<string, any> = {};

    for (const o of ordens) {
      const d = dataCalendario(o);
      if (!d) continue;
      const cor = CORES_STATUS[o.status] ?? '#64748b';
      if (!acc[d]) acc[d] = { dots: [] };
      if (acc[d].dots.length < 3) acc[d].dots.push({ color: cor, key: `os-${o.id}` });
    }

    for (const a of agendamentos) {
      if (!acc[a.data]) acc[a.data] = { dots: [] };
      if (acc[a.data].dots.length < 3) acc[a.data].dots.push({ color: COR_AGENDAMENTO, key: `ag-${a.id}` });
    }

    acc[dataSelecionada] = { ...(acc[dataSelecionada] ?? { dots: [] }), selected: true, selectedColor: tema.primario + '55' };
    return acc;
  }, [ordens, agendamentos, dataSelecionada, tema.primario]);

  const itensNaData = useMemo((): ItemLista[] => {
    const osDia = ordens
      .filter((o) => dataCalendario(o) === dataSelecionada)
      .map((o): ItemLista => ({ tipo: 'os', os: o }));
    const agDia = agendamentos
      .filter((a) => a.data === dataSelecionada)
      .sort((a, b) => (a.horario ?? '').localeCompare(b.horario ?? ''))
      .map((a): ItemLista => ({ tipo: 'agendamento', ag: a }));
    return [...agDia, ...osDia];
  }, [ordens, agendamentos, dataSelecionada]);

  if (carregando) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={tema.primario} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={[styles.iconBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Ionicons name="arrow-back" size={20} color={tema.texto} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>Agenda</Text>
          <Text style={[styles.subtitulo, { color: tema.textoMuted }]}>
            {ordens.length} OS  ·  {agendamentos.length} agendamentos
          </Text>
        </View>
        <TouchableOpacity
          onPress={abrirModal}
          style={[styles.iconBtn, { backgroundColor: COR_AGENDAMENTO, borderColor: COR_AGENDAMENTO }]}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={itensNaData}
        keyExtractor={(item) => item.tipo === 'os' ? `os-${item.os.id}` : `ag-${item.ag.id}`}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={recarregando} onRefresh={recarregar} tintColor={tema.primario} colors={[tema.primario]} />}
        ListHeaderComponent={
          <>
            {/* Calendário */}
            <View style={[styles.calendarioBox, { backgroundColor: tema.card, borderColor: tema.borda }]}>
              <Calendar
                current={dataSelecionada}
                onDayPress={(day: { dateString: string }) => setDataSelecionada(day.dateString)}
                markingType="multi-dot"
                markedDates={marcadores}
                theme={{
                  backgroundColor: 'transparent', calendarBackground: 'transparent',
                  textSectionTitleColor: tema.textoMuted,
                  selectedDayBackgroundColor: tema.primario,
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: tema.primario,
                  dayTextColor: tema.texto,
                  textDisabledColor: tema.textoFraco,
                  dotColor: tema.primario, selectedDotColor: '#ffffff',
                  arrowColor: tema.primario, monthTextColor: tema.texto,
                  textDayFontSize: 14, textMonthFontSize: 15,
                  textMonthFontWeight: '700', textDayHeaderFontSize: 11,
                }}
              />
            </View>

            {/* Legenda */}
            <View style={styles.legendaRow}>
              {[
                { cor: '#d97706', label: 'Aberta' },
                { cor: '#2563eb', label: 'Em Andamento' },
                { cor: '#16a34a', label: 'Concluída' },
                { cor: COR_AGENDAMENTO, label: 'Agendamento' },
              ].map((l) => (
                <View key={l.label} style={styles.legendaItem}>
                  <View style={[styles.legendaDot, { backgroundColor: l.cor }]} />
                  <Text style={[styles.legendaTexto, { color: tema.textoMuted }]}>{l.label}</Text>
                </View>
              ))}
            </View>

            {/* Data selecionada */}
            <View style={styles.dataHeader}>
              <View style={[styles.dataIcone, { backgroundColor: tema.primario + '1a' }]}>
                <Ionicons name="calendar" size={13} color={tema.primario} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dataTexto, { color: tema.texto }]} numberOfLines={1}>
                  {formatarData(dataSelecionada)}
                </Text>
                {dataSelecionada === hoje && <Text style={[styles.dataHoje, { color: tema.primario }]}>Hoje</Text>}
              </View>
              <TouchableOpacity
                style={[styles.agendarBtn, { backgroundColor: COR_AGENDAMENTO + '1a', borderColor: COR_AGENDAMENTO + '44' }]}
                onPress={abrirModal}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={12} color={COR_AGENDAMENTO} />
                <Text style={[styles.agendarBtnTexto, { color: COR_AGENDAMENTO }]}>Novo agendamento</Text>
              </TouchableOpacity>
            </View>

            {/* Vazio */}
            {itensNaData.length === 0 && (
              <View style={[styles.vazio, { backgroundColor: tema.card, borderColor: tema.borda }]}>
                <Ionicons name="calendar-clear-outline" size={28} color={tema.textoFraco} />
                <Text style={[styles.vazioTexto, { color: tema.textoMuted }]}>Nenhum item neste dia</Text>
                <TouchableOpacity
                  style={[styles.vazioBtn, { backgroundColor: COR_AGENDAMENTO + '1a', borderColor: COR_AGENDAMENTO + '44' }]}
                  onPress={abrirModal}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={13} color={COR_AGENDAMENTO} />
                  <Text style={[styles.vazioBtnTexto, { color: COR_AGENDAMENTO }]}>Criar agendamento</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => {
          if (item.tipo === 'agendamento') {
            const ag = item.ag;
            return (
              <View style={[styles.card, { backgroundColor: tema.card, borderColor: tema.borda }]}>
                <View style={[styles.cardBarra, { backgroundColor: COR_AGENDAMENTO }]} />
                <View style={styles.cardCorpo}>
                  <View style={styles.cardTop}>
                    <View style={[styles.agIcone, { backgroundColor: COR_AGENDAMENTO + '20' }]}>
                      <Ionicons name="bookmark" size={12} color={COR_AGENDAMENTO} />
                    </View>
                    <Text style={[styles.cardCliente, { color: tema.texto, flex: 1 }]} numberOfLines={1}>{ag.titulo}</Text>
                    {!!ag.horario && (
                      <View style={[styles.horarioBadge, { backgroundColor: tema.fundo }]}>
                        <Ionicons name="time-outline" size={10} color={tema.textoMuted} />
                        <Text style={[styles.horarioTexto, { color: tema.textoMuted }]}>{ag.horario}</Text>
                      </View>
                    )}
                  </View>
                  {(!!ag.cliente || !!ag.tecnico) && (
                    <View style={styles.agMetaRow}>
                      {!!ag.cliente && <Text style={[styles.agMeta, { color: tema.textoSec }]}>{ag.cliente}</Text>}
                      {!!ag.cliente && !!ag.tecnico && <Text style={[styles.agMeta, { color: tema.textoFraco }]}>·</Text>}
                      {!!ag.tecnico && (
                        <View style={styles.tecRow}>
                          <Ionicons name="person-outline" size={10} color={tema.textoFraco} />
                          <Text style={[styles.agMeta, { color: tema.textoFraco }]}>{ag.tecnico}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  {!!ag.observacao && (
                    <Text style={[styles.agObs, { color: tema.textoFraco }]} numberOfLines={2}>{ag.observacao}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => excluirAgendamento(ag.id)}
                  style={styles.excluirBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={15} color="#f87171" />
                </TouchableOpacity>
              </View>
            );
          }

          const os  = item.os;
          const cor = CORES_STATUS[os.status] ?? '#64748b';
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: tema.card, borderColor: tema.borda }]}
              onPress={() => onAbrirOS(os.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.cardBarra, { backgroundColor: cor }]} />
              <View style={styles.cardCorpo}>
                <View style={styles.cardTop}>
                  <View style={[styles.agIcone, { backgroundColor: cor + '20' }]}>
                    <Ionicons name="document-text" size={12} color={cor} />
                  </View>
                  <Text style={[styles.cardCliente, { color: tema.texto, flex: 1 }]} numberOfLines={1}>{os.cliente}</Text>
                  <View style={[styles.badge, { backgroundColor: cor + '22' }]}>
                    <Text style={[styles.badgeTexto, { color: cor }]}>{os.status}</Text>
                  </View>
                </View>
                <Text style={[styles.cardDetalhe, { color: tema.textoSec }]} numberOfLines={1}>
                  {os.motor}  ·  {os.tipoManutencao}
                </Text>
                {!!os.tecnicoResponsavel && (
                  <View style={styles.tecRow}>
                    <Ionicons name="person-outline" size={10} color={tema.textoFraco} />
                    <Text style={[styles.agMeta, { color: tema.textoFraco }]}>{os.tecnicoResponsavel}</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={14} color={tema.textoFraco} style={{ paddingHorizontal: 10 }} />
            </TouchableOpacity>
          );
        }}
      />

      {/* Modal novo agendamento */}
      <Modal visible={modalAberto} animationType="slide" transparent onRequestClose={() => setModalAberto(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modalFundo}>
            <View style={[styles.modalBox, { backgroundColor: tema.card }]}>
              <View style={[styles.modalHandle, { backgroundColor: tema.borda }]} />

              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitulo, { color: tema.texto }]}>Novo Agendamento</Text>
                  <Text style={[styles.modalData, { color: tema.primario }]}>{formatarData(dataSelecionada)}</Text>
                </View>
                <TouchableOpacity onPress={() => setModalAberto(false)} style={[styles.modalCloseBtn, { backgroundColor: tema.fundo }]}>
                  <Ionicons name="close" size={18} color={tema.textoMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Título */}
                <Text style={[styles.fieldLabel, { color: tema.textoSec }]}>Título *</Text>
                <View style={[styles.fieldBox, { backgroundColor: tema.fundo, borderColor: tema.borda }]}>
                  <Ionicons name="bookmark-outline" size={16} color={tema.textoMuted} />
                  <TextInput
                    style={[styles.fieldInput, { color: tema.texto }]}
                    placeholder="Ex: Visita técnica, reunião..."
                    placeholderTextColor={tema.textoFraco}
                    value={titulo}
                    onChangeText={setTitulo}
                  />
                </View>

                {/* Horário */}
                <Text style={[styles.fieldLabel, { color: tema.textoSec }]}>Horário (opcional)</Text>
                <View style={[styles.fieldBox, { backgroundColor: tema.fundo, borderColor: tema.borda }]}>
                  <Ionicons name="time-outline" size={16} color={tema.textoMuted} />
                  <TextInput
                    style={[styles.fieldInput, { color: tema.texto }]}
                    placeholder="HH:MM"
                    placeholderTextColor={tema.textoFraco}
                    value={horario}
                    onChangeText={(v) => setHorario(formatarHorario(v))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>

                {/* Cliente */}
                <Text style={[styles.fieldLabel, { color: tema.textoSec }]}>Cliente (opcional)</Text>
                <View style={[styles.fieldBox, { backgroundColor: tema.fundo, borderColor: tema.borda }]}>
                  <Ionicons name="business-outline" size={16} color={tema.textoMuted} />
                  <TextInput
                    style={[styles.fieldInput, { color: tema.texto }]}
                    placeholder="Nome do cliente"
                    placeholderTextColor={tema.textoFraco}
                    value={cliente}
                    onChangeText={setCliente}
                  />
                </View>

                {/* Técnico */}
                {tecnicos.length > 0 && (
                  <>
                    <Text style={[styles.fieldLabel, { color: tema.textoSec }]}>Técnico (opcional)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.tecChips}>
                      <TouchableOpacity
                        style={[styles.tecChip, { borderColor: !tecnicoSel ? '#9333ea' : tema.borda, backgroundColor: !tecnicoSel ? '#9333ea22' : tema.fundo }]}
                        onPress={() => setTecnicoSel('')}
                      >
                        <Text style={[styles.tecChipTexto, { color: !tecnicoSel ? '#9333ea' : tema.textoMuted }]}>Nenhum</Text>
                      </TouchableOpacity>
                      {tecnicos.map((t) => {
                        const ativo = tecnicoSel === t.nome;
                        return (
                          <TouchableOpacity
                            key={t.id}
                            style={[styles.tecChip, { borderColor: ativo ? '#9333ea' : tema.borda, backgroundColor: ativo ? '#9333ea22' : tema.fundo }]}
                            onPress={() => setTecnicoSel(ativo ? '' : t.nome)}
                          >
                            <Text style={[styles.tecChipTexto, { color: ativo ? '#9333ea' : tema.textoMuted }]}>{t.nome}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </>
                )}

                {/* Observação */}
                <Text style={[styles.fieldLabel, { color: tema.textoSec }]}>Observação (opcional)</Text>
                <View style={[styles.fieldBox, styles.fieldBoxTextarea, { backgroundColor: tema.fundo, borderColor: tema.borda }]}>
                  <TextInput
                    style={[styles.fieldInput, { color: tema.texto, paddingTop: 0, minHeight: 70 }]}
                    placeholder="Detalhes adicionais..."
                    placeholderTextColor={tema.textoFraco}
                    value={observacao}
                    onChangeText={setObservacao}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.salvarBtn, { backgroundColor: COR_AGENDAMENTO }, salvando && { opacity: 0.6 }]}
                  onPress={salvarAgendamento}
                  disabled={salvando}
                  activeOpacity={0.9}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.salvarBtnTexto}>{salvando ? 'Salvando...' : 'Salvar Agendamento'}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function criarEstilos(t: AppTema) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.fundo },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 20, paddingTop: 60, paddingBottom: 14,
    },
    iconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    titulo: { color: t.texto, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
    subtitulo: { fontSize: 11, marginTop: 1 },
    lista: { paddingBottom: 48 },
    calendarioBox: { marginHorizontal: 16, borderRadius: 18, overflow: 'hidden', borderWidth: 1, marginBottom: 4 },
    legendaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, paddingVertical: 10 },
    legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendaDot: { width: 7, height: 7, borderRadius: 4 },
    legendaTexto: { fontSize: 10, fontWeight: '600' },
    dataHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 20, paddingVertical: 10,
    },
    dataIcone: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    dataTexto: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
    dataHoje: { fontSize: 10, fontWeight: '600', marginTop: 1 },
    agendarBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
    },
    agendarBtnTexto: { fontSize: 11, fontWeight: '700' },
    vazio: {
      alignItems: 'center', padding: 24, marginHorizontal: 16,
      borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', gap: 8,
    },
    vazioTexto: { fontSize: 13, fontWeight: '600' },
    vazioBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
    },
    vazioBtnTexto: { fontSize: 12, fontWeight: '700' },
    card: {
      flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10,
      borderRadius: 13, borderWidth: 1, overflow: 'hidden',
    },
    cardBarra: { width: 3, alignSelf: 'stretch' },
    cardCorpo: { flex: 1, padding: 12 },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
    agIcone: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    cardCliente: { fontSize: 13, fontWeight: '700' },
    horarioBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
    horarioTexto: { fontSize: 10, fontWeight: '600' },
    badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, marginLeft: 'auto' },
    badgeTexto: { fontSize: 9, fontWeight: '700' },
    cardDetalhe: { fontSize: 11, marginBottom: 3 },
    tecRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    agMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
    agMeta: { fontSize: 11 },
    agObs: { fontSize: 11, marginTop: 4, lineHeight: 16 },
    excluirBtn: { padding: 12, flexShrink: 0 },
    // Modal
    modalFundo: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
    modalBox: {
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 20, paddingBottom: 36, maxHeight: '90%',
    },
    modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    modalTitulo: { fontSize: 18, fontWeight: '800' },
    modalData: { fontSize: 12, fontWeight: '600', marginTop: 3, textTransform: 'capitalize' },
    modalCloseBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    fieldLabel: {
      fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
      letterSpacing: 0.5, marginBottom: 6, marginTop: 12,
    },
    fieldBox: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: 12, borderWidth: 1, paddingHorizontal: 13,
    },
    fieldBoxTextarea: { alignItems: 'flex-start', paddingVertical: 12 },
    fieldInput: { flex: 1, fontSize: 14, paddingVertical: 12 },
    tecChips: { gap: 7, paddingBottom: 4, flexDirection: 'row' },
    tecChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
    tecChipTexto: { fontSize: 12, fontWeight: '600' },
    salvarBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      borderRadius: 14, paddingVertical: 15, marginTop: 20,
      shadowColor: '#db2777', shadowOpacity: 0.3, shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    salvarBtnTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },
  });
}
