import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl,
} from 'react-native';
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

  const marcadores = ordens.reduce<Record<string, any>>((acc, o) => {
    if (!o.dataAgendada) return acc;
    const cor = CORES_STATUS[o.status] ?? '#64748b';
    if (!acc[o.dataAgendada]) acc[o.dataAgendada] = { dots: [] };
    acc[o.dataAgendada].dots.push({ color: cor, key: o.id });
    return acc;
  }, {});

  if (marcadores[dataSelecionada]) {
    marcadores[dataSelecionada].selected = true;
    marcadores[dataSelecionada].selectedColor = tema.primario + '33';
  } else {
    marcadores[dataSelecionada] = { dots: [], selected: true, selectedColor: tema.primario + '33' };
  }

  const ordensNaData = ordens.filter((o) => o.dataAgendada === dataSelecionada);

  function formatarDataExibicao(iso: string) {
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={styles.voltarBotao}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Agenda</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={ordensNaData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl refreshing={recarregando} onRefresh={recarregar}
            tintColor={tema.primario} colors={[tema.primario]} />
        }
        ListHeaderComponent={
          <>
            <Calendar
              current={dataSelecionada}
              onDayPress={(day: { dateString: string }) => setDataSelecionada(day.dateString)}
              markingType="multi-dot"
              markedDates={marcadores}
              theme={{
                backgroundColor: tema.fundo,
                calendarBackground: tema.card,
                textSectionTitleColor: tema.textoMuted,
                selectedDayBackgroundColor: tema.primario,
                selectedDayTextColor: '#ffffff',
                todayTextColor: tema.primario,
                dayTextColor: '#e2e8f0',
                textDisabledColor: tema.textoFraco,
                dotColor: tema.primario,
                selectedDotColor: '#ffffff',
                arrowColor: tema.primario,
                monthTextColor: '#ffffff',
                textDayFontSize: 14,
                textMonthFontSize: 15,
                textMonthFontWeight: '700',
                textDayHeaderFontSize: 12,
              }}
              style={styles.calendario}
            />
            <View style={styles.secaoHeader}>
              <Ionicons name="calendar-outline" size={15} color={tema.textoMuted} />
              <Text style={styles.secaoTitulo}>
                {formatarDataExibicao(dataSelecionada)}{dataSelecionada === hoje ? '  (hoje)' : ''}
              </Text>
            </View>
            {ordensNaData.length === 0 && (
              <View style={styles.vazio}>
                <Ionicons name="calendar-clear-outline" size={36} color={tema.borda} />
                <Text style={styles.vazioTexto}>Nenhuma OS agendada para este dia</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => onAbrirOS(item.id)} activeOpacity={0.8}>
            <View style={[styles.statusBarra, { backgroundColor: CORES_STATUS[item.status] }]} />
            <View style={styles.cardConteudo}>
              <View style={styles.cardTopo}>
                <Text style={styles.cardCliente} numberOfLines={1}>{item.cliente}</Text>
                <View style={[styles.badge, { backgroundColor: CORES_STATUS[item.status] + '22' }]}>
                  <Text style={[styles.badgeTexto, { color: CORES_STATUS[item.status] }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.cardDetalhe}>{item.motor} · {item.tipoManutencao}</Text>
              {!!item.tecnicoResponsavel && (
                <View style={styles.tecnicoRow}>
                  <Ionicons name="person-outline" size={12} color={tema.textoMuted} />
                  <Text style={styles.tecnicoTexto}>{item.tecnicoResponsavel}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
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
    voltarBotao: {
      width: 36, height: 36, borderRadius: 10, backgroundColor: t.card,
      borderWidth: 1, borderColor: t.borda, alignItems: 'center', justifyContent: 'center',
    },
    titulo: { color: t.texto, fontSize: 17, fontWeight: '700' },
    calendario: {
      marginHorizontal: 16, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: t.borda, marginBottom: 8,
    },
    secaoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 14 },
    secaoTitulo: { color: t.textoSec, fontSize: 13, fontWeight: '600' },
    lista: { paddingBottom: 40 },
    vazio: { alignItems: 'center', paddingTop: 20, gap: 8 },
    vazioTexto: { color: t.textoFraco, fontSize: 13 },
    card: {
      flexDirection: 'row', marginHorizontal: 16, marginBottom: 10,
      backgroundColor: t.card, borderRadius: 14, borderWidth: 1, borderColor: t.borda, overflow: 'hidden',
    },
    statusBarra: { width: 4 },
    cardConteudo: { flex: 1, padding: 14 },
    cardTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    cardCliente: { color: t.texto, fontSize: 14, fontWeight: '600', flex: 1, marginRight: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeTexto: { fontSize: 11, fontWeight: '700' },
    cardDetalhe: { color: t.textoMuted, fontSize: 12, marginTop: 2 },
    tecnicoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    tecnicoTexto: { color: t.textoMuted, fontSize: 12 },
  });
}
