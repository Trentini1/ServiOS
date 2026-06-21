import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { carregar } from '../utils/storage';
import type { OrdemServico } from './OSListScreen';
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

const CORES_STATUS: Record<string, string> = {
  Aberta: '#d97706', 'Em Andamento': '#2563eb', Concluída: '#16a34a',
};

// Converte DD/MM/YYYY → YYYY-MM-DD (para exibição no calendário)
function brParaISO(dataBR: string): string | null {
  const p = dataBR.split('/');
  if (p.length !== 3 || p[2].length !== 4) return null;
  return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
}

// Retorna a data que a OS deve ocupar no calendário
function dataCalendario(os: OrdemServico): string | null {
  if (os.dataAgendada) return os.dataAgendada; // já em YYYY-MM-DD
  return brParaISO(os.dataCriacao);
}

// ISO → "Seg., 5 de junho" etc.
function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  const d = new Date(Number(ano), Number(mes) - 1, Number(dia));
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ISO → DD/MM/AAAA (para pré-preencher formulário)
function isoParaBR(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

type Props = {
  onVoltar: () => void;
  onAbrirOS: (id: string) => void;
  onNovaOSComData: (dataAgendadaBR: string) => void;  // navega p/ form com data pré-preenchida
};

export default function AgendaScreen({ onVoltar, onAbrirOS, onNovaOSComData }: Props) {
  const tema   = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);
  const hoje   = new Date().toISOString().split('T')[0];
  const [dataSelecionada, setDataSelecionada] = useState(hoje);
  const [ordens, setOrdens]     = useState<OrdemServico[]>([]);
  const [recarregando, setRecarregando] = useState(false);

  const carregarOrdens = useCallback(async () => {
    const lista = (await carregar<OrdemServico[]>('ordensServico')) ?? [];
    setOrdens(lista);
  }, []);

  useEffect(() => { carregarOrdens(); }, [carregarOrdens]);

  async function recarregar() {
    setRecarregando(true);
    await carregarOrdens();
    setRecarregando(false);
  }

  // Mapeia cada OS para a data que vai aparecer no calendário
  const marcadores = useMemo(() => {
    const acc: Record<string, any> = {};
    for (const o of ordens) {
      const dataISO = dataCalendario(o);
      if (!dataISO) continue;
      const cor = CORES_STATUS[o.status] ?? '#64748b';
      if (!acc[dataISO]) acc[dataISO] = { dots: [] };
      if (acc[dataISO].dots.length < 3) { // limite de 3 dots por dia
        acc[dataISO].dots.push({ color: cor, key: o.id });
      }
    }
    acc[dataSelecionada] = {
      ...(acc[dataSelecionada] ?? { dots: [] }),
      selected: true,
      selectedColor: tema.primario + '55',
    };
    acc[hoje] = {
      ...(acc[hoje] ?? { dots: [] }),
      today: true,
    };
    return acc;
  }, [ordens, dataSelecionada, tema.primario, hoje]);

  const ordensNaData = useMemo(() =>
    ordens.filter((o) => dataCalendario(o) === dataSelecionada),
    [ordens, dataSelecionada]
  );

  const totalComData = useMemo(() =>
    ordens.filter((o) => !!o.dataAgendada).length,
    [ordens]
  );

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
            {ordens.length} OS  ·  {totalComData} agendadas
          </Text>
        </View>
        {/* Botão agendar nova OS no dia selecionado */}
        <TouchableOpacity
          onPress={() => onNovaOSComData(isoParaBR(dataSelecionada))}
          style={[styles.iconBtn, { backgroundColor: tema.primario, borderColor: tema.primario }]}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={ordensNaData}
        keyExtractor={(item) => item.id}
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
                  backgroundColor: 'transparent',
                  calendarBackground: 'transparent',
                  textSectionTitleColor: tema.textoMuted,
                  selectedDayBackgroundColor: tema.primario,
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: tema.primario,
                  dayTextColor: tema.texto,
                  textDisabledColor: tema.textoFraco,
                  dotColor: tema.primario,
                  selectedDotColor: '#ffffff',
                  arrowColor: tema.primario,
                  monthTextColor: tema.texto,
                  textDayFontSize: 14,
                  textMonthFontSize: 15,
                  textMonthFontWeight: '700',
                  textDayHeaderFontSize: 11,
                }}
              />
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
                {dataSelecionada === hoje && (
                  <Text style={[styles.dataHoje, { color: tema.primario }]}>Hoje</Text>
                )}
              </View>
              {/* Botão agendar rápido no dia */}
              <TouchableOpacity
                style={[styles.agendarBtn, { backgroundColor: tema.primario + '1a', borderColor: tema.primario + '44' }]}
                onPress={() => onNovaOSComData(isoParaBR(dataSelecionada))}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={13} color={tema.primario} />
                <Text style={[styles.agendarBtnTexto, { color: tema.primario }]}>Agendar</Text>
              </TouchableOpacity>
            </View>

            {/* Legenda */}
            {ordens.length > 0 && (
              <View style={[styles.legendaRow, { backgroundColor: tema.card, borderColor: tema.borda }]}>
                {Object.entries(CORES_STATUS).map(([s, c]) => (
                  <View key={s} style={styles.legendaItem}>
                    <View style={[styles.legendaDot, { backgroundColor: c }]} />
                    <Text style={[styles.legendaTexto, { color: tema.textoMuted }]}>{s}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Vazio no dia */}
            {ordensNaData.length === 0 && (
              <View style={[styles.vazio, { backgroundColor: tema.card, borderColor: tema.borda }]}>
                <Ionicons name="calendar-clear-outline" size={28} color={tema.textoFraco} />
                <Text style={[styles.vazioTexto, { color: tema.textoMuted }]}>Nenhuma OS neste dia</Text>
                <TouchableOpacity
                  style={[styles.vazioAgendar, { backgroundColor: tema.primario + '1a', borderColor: tema.primario + '44' }]}
                  onPress={() => onNovaOSComData(isoParaBR(dataSelecionada))}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={14} color={tema.primario} />
                  <Text style={[styles.vazioAgendarTexto, { color: tema.primario }]}>Criar OS para este dia</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => {
          const cor        = CORES_STATUS[item.status] ?? '#64748b';
          const temAgenda  = !!item.dataAgendada;
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: tema.card, borderColor: tema.borda }]}
              onPress={() => onAbrirOS(item.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.cardBarra, { backgroundColor: cor }]} />
              <View style={styles.cardCorpo}>
                <View style={styles.cardTop}>
                  <Text style={[styles.cardCliente, { color: tema.texto }]} numberOfLines={1}>{item.cliente}</Text>
                  <View style={styles.cardBadges}>
                    {temAgenda && (
                      <View style={[styles.agendadoBadge, { backgroundColor: tema.primario + '18' }]}>
                        <Ionicons name="calendar" size={9} color={tema.primario} />
                      </View>
                    )}
                    <View style={[styles.badge, { backgroundColor: cor + '22' }]}>
                      <Text style={[styles.badgeTexto, { color: cor }]}>{item.status}</Text>
                    </View>
                  </View>
                </View>
                <Text style={[styles.cardDetalhe, { color: tema.textoSec }]} numberOfLines={1}>
                  {item.motor}  ·  {item.tipoManutencao}
                </Text>
                {!!item.tecnicoResponsavel && (
                  <View style={styles.tecnicoRow}>
                    <Ionicons name="person-outline" size={10} color={tema.textoFraco} />
                    <Text style={[styles.tecnicoTexto, { color: tema.textoFraco }]}>{item.tecnicoResponsavel}</Text>
                  </View>
                )}
                <Text style={[styles.cardDataCriacao, { color: tema.textoFraco }]}>
                  {temAgenda ? `Agendada · ${item.dataCriacao}` : `Criada · ${item.dataCriacao}`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={tema.textoFraco} style={{ paddingHorizontal: 10 }} />
            </TouchableOpacity>
          );
        }}
      />
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
    dataHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 20, paddingVertical: 14,
    },
    dataIcone: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    dataTexto: { fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
    dataHoje: { fontSize: 10, fontWeight: '600', marginTop: 1 },
    agendarBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
    },
    agendarBtnTexto: { fontSize: 11, fontWeight: '700' },
    legendaRow: {
      flexDirection: 'row', justifyContent: 'center', gap: 14,
      marginHorizontal: 16, marginBottom: 6, paddingVertical: 8,
      borderRadius: 10, borderWidth: 1,
    },
    legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendaDot: { width: 8, height: 8, borderRadius: 4 },
    legendaTexto: { fontSize: 10, fontWeight: '600' },
    vazio: {
      alignItems: 'center', padding: 24, marginHorizontal: 16,
      borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', gap: 8,
    },
    vazioTexto: { fontSize: 14, fontWeight: '600' },
    vazioAgendar: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginTop: 4,
    },
    vazioAgendarTexto: { fontSize: 13, fontWeight: '700' },
    card: {
      flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10,
      borderRadius: 13, borderWidth: 1, overflow: 'hidden',
    },
    cardBarra: { width: 3, alignSelf: 'stretch' },
    cardCorpo: { flex: 1, padding: 13 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    cardCliente: { fontSize: 14, fontWeight: '700', flex: 1 },
    cardBadges: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 6 },
    agendadoBadge: { width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
    badgeTexto: { fontSize: 10, fontWeight: '700' },
    cardDetalhe: { fontSize: 12, marginBottom: 4 },
    tecnicoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
    tecnicoTexto: { fontSize: 11 },
    cardDataCriacao: { fontSize: 10 },
  });
}
