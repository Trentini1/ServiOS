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

type Props = { onVoltar: () => void; onAbrirOS: (id: string) => void };

export default function AgendaScreen({ onVoltar, onAbrirOS }: Props) {
  const tema = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);
  const hoje = new Date().toISOString().split('T')[0];
  const [dataSelecionada, setDataSelecionada] = useState(hoje);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [recarregando, setRecarregando] = useState(false);

  const carregarOrdens = useCallback(async () => {
    const lista = (await carregar<OrdemServico[]>('ordensServico')) ?? [];
    setOrdens(lista.filter((o) => !!o.dataAgendada));
  }, []);

  useEffect(() => { carregarOrdens(); }, [carregarOrdens]);

  async function recarregar() {
    setRecarregando(true);
    await carregarOrdens();
    setRecarregando(false);
  }

  const marcadores = useMemo(() => {
    const acc: Record<string, any> = {};
    for (const o of ordens) {
      if (!o.dataAgendada) continue;
      const cor = CORES_STATUS[o.status] ?? '#64748b';
      if (!acc[o.dataAgendada]) acc[o.dataAgendada] = { dots: [] };
      acc[o.dataAgendada].dots.push({ color: cor, key: o.id });
    }
    acc[dataSelecionada] = {
      ...(acc[dataSelecionada] ?? { dots: [] }),
      selected: true,
      selectedColor: tema.primario + '44',
    };
    return acc;
  }, [ordens, dataSelecionada, tema.primario]);

  const ordensNaData = ordens.filter((o) => o.dataAgendada === dataSelecionada);

  function formatarData(iso: string) {
    const [ano, mes, dia] = iso.split('-');
    const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
    return data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={[styles.iconBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Ionicons name="arrow-back" size={20} color={tema.texto} />
        </TouchableOpacity>
        <View>
          <Text style={styles.titulo}>Agenda</Text>
          <Text style={[styles.subtitulo, { color: tema.textoMuted }]}>{ordens.length} OS agendadas</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={ordensNaData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={recarregando} onRefresh={recarregar}
            tintColor={tema.primario} colors={[tema.primario]} />
        }
        ListHeaderComponent={
          <>
            {/* Calendário */}
            <View style={[styles.calendarioBox, { borderColor: tema.borda }]}>
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

            {/* Separador de data */}
            <View style={styles.dataHeader}>
              <View style={[styles.dataIconeBox, { backgroundColor: tema.primario + '1a' }]}>
                <Ionicons name="calendar" size={14} color={tema.primario} />
              </View>
              <View>
                <Text style={[styles.dataTexto, { color: tema.texto }]} numberOfLines={1}>
                  {formatarData(dataSelecionada)}
                </Text>
                {dataSelecionada === hoje && (
                  <Text style={[styles.dataHoje, { color: tema.primario }]}>Hoje</Text>
                )}
              </View>
              {ordensNaData.length > 0 && (
                <View style={[styles.contadorBadge, { backgroundColor: tema.primario + '22' }]}>
                  <Text style={[styles.contadorTexto, { color: tema.primario }]}>{ordensNaData.length}</Text>
                </View>
              )}
            </View>

            {/* Vazio */}
            {ordensNaData.length === 0 && (
              <View style={[styles.vazio, { backgroundColor: tema.card, borderColor: tema.borda }]}>
                <Ionicons name="calendar-clear-outline" size={32} color={tema.textoFraco} />
                <Text style={[styles.vazioTexto, { color: tema.textoMuted }]}>Nenhuma OS neste dia</Text>
                <Text style={[styles.vazioSub, { color: tema.textoFraco }]}>
                  Crie uma OS e defina data de agendamento.
                </Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => {
          const cor = CORES_STATUS[item.status] ?? '#64748b';
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: tema.card, borderColor: tema.borda }]}
              onPress={() => onAbrirOS(item.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.cardBarra, { backgroundColor: cor }]} />
              <View style={styles.cardCorpo}>
                <View style={styles.cardTop}>
                  <Text style={[styles.cardCliente, { color: tema.texto }]} numberOfLines={1}>
                    {item.cliente}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: cor + '22' }]}>
                    <Text style={[styles.badgeTexto, { color: cor }]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={[styles.cardDetalhe, { color: tema.textoSec }]} numberOfLines={1}>
                  {item.motor}  ·  {item.tipoManutencao}
                </Text>
                {!!item.tecnicoResponsavel && (
                  <View style={styles.tecnicoRow}>
                    <Ionicons name="person-outline" size={11} color={tema.textoFraco} />
                    <Text style={[styles.tecnicoTexto, { color: tema.textoFraco }]}>{item.tecnicoResponsavel}</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={tema.textoFraco} style={{ paddingHorizontal: 10 }} />
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
      paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    },
    iconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    titulo: { color: t.texto, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
    subtitulo: { fontSize: 12, marginTop: 1 },
    lista: { paddingBottom: 48 },
    calendarioBox: {
      marginHorizontal: 16, borderRadius: 18, overflow: 'hidden',
      borderWidth: 1, backgroundColor: t.card, marginBottom: 4,
    },
    dataHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 20, paddingVertical: 16,
    },
    dataIconeBox: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    dataTexto: { fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
    dataHoje: { fontSize: 11, fontWeight: '600', marginTop: 1 },
    contadorBadge: {
      marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    },
    contadorTexto: { fontSize: 12, fontWeight: '700' },
    vazio: {
      alignItems: 'center', padding: 28, marginHorizontal: 16,
      borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', gap: 6,
    },
    vazioTexto: { fontSize: 15, fontWeight: '600' },
    vazioSub: { fontSize: 12, textAlign: 'center' },
    card: {
      flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10,
      borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    },
    cardBarra: { width: 4, alignSelf: 'stretch' },
    cardCorpo: { flex: 1, padding: 14 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    cardCliente: { fontSize: 14, fontWeight: '700', flex: 1 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 8 },
    badgeTexto: { fontSize: 10, fontWeight: '700' },
    cardDetalhe: { fontSize: 12, marginBottom: 4 },
    tecnicoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    tecnicoTexto: { fontSize: 11 },
  });
}
