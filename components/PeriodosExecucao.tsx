import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DiaExecucao, PeriodoTrabalho } from '../screens/OSListScreen';

type Props = {
  dias: DiaExecucao[];
  onChange: (dias: DiaExecucao[]) => void;
};

function formatarDataInput(v: string) {
  const n = v.replace(/\D/g, '').slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
}

function formatarHoraInput(v: string) {
  const n = v.replace(/\D/g, '').slice(0, 4);
  if (n.length <= 2) return n;
  return `${n.slice(0, 2)}:${n.slice(2)}`;
}

function dataParaISO(dataBR: string): string {
  const [d, m, a] = dataBR.split('/');
  return `${a}-${m?.padStart(2, '0')}-${d?.padStart(2, '0')}`;
}

function isoParaBR(iso: string): string {
  return iso.split('-').reverse().join('/');
}

function calcularTotal(periodos: PeriodoTrabalho[]): string {
  let totalMin = 0;
  for (const p of periodos) {
    const [eh, em] = p.entrada.split(':').map(Number);
    const [sh, sm] = p.saida.split(':').map(Number);
    if (!isNaN(eh) && !isNaN(em) && !isNaN(sh) && !isNaN(sm)) {
      const diff = (sh * 60 + sm) - (eh * 60 + em);
      if (diff > 0) totalMin += diff;
    }
  }
  if (totalMin === 0) return '';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h${m > 0 ? `${m.toString().padStart(2, '0')}min` : ''}`;
}

export default function PeriodosExecucao({ dias, onChange }: Props) {
  const [novaData, setNovaData] = useState('');
  const [adicionandoData, setAdicionandoData] = useState(false);

  function adicionarData() {
    if (novaData.length < 10) {
      Alert.alert('Atenção', 'Digite uma data completa (DD/MM/AAAA).');
      return;
    }
    const iso = dataParaISO(novaData);
    if (dias.some((d) => d.data === iso)) {
      Alert.alert('Atenção', 'Esta data já foi adicionada.');
      return;
    }
    onChange([...dias, { data: iso, periodos: [{ entrada: '', saida: '' }] }]);
    setNovaData('');
    setAdicionandoData(false);
  }

  function removerDia(iso: string) {
    Alert.alert('Remover data', `Remover ${isoParaBR(iso)} e todos os períodos?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => onChange(dias.filter((d) => d.data !== iso)) },
    ]);
  }

  function adicionarPeriodo(iso: string) {
    onChange(dias.map((d) =>
      d.data === iso ? { ...d, periodos: [...d.periodos, { entrada: '', saida: '' }] } : d
    ));
  }

  function removerPeriodo(iso: string, index: number) {
    onChange(dias.map((d) => {
      if (d.data !== iso) return d;
      const periodos = d.periodos.filter((_, i) => i !== index);
      return { ...d, periodos: periodos.length ? periodos : [{ entrada: '', saida: '' }] };
    }));
  }

  function atualizarHora(iso: string, index: number, campo: 'entrada' | 'saida', valor: string) {
    onChange(dias.map((d) => {
      if (d.data !== iso) return d;
      const periodos = d.periodos.map((p, i) =>
        i === index ? { ...p, [campo]: formatarHoraInput(valor) } : p
      );
      return { ...d, periodos };
    }));
  }

  const diasOrdenados = [...dias].sort((a, b) => a.data.localeCompare(b.data));

  return (
    <View>
      {diasOrdenados.map((dia) => {
        const total = calcularTotal(dia.periodos);
        return (
          <View key={dia.data} style={styles.diaCard}>
            <View style={styles.diaHeader}>
              <View style={styles.diaHeaderEsq}>
                <Ionicons name="calendar" size={14} color="#d97706" />
                <Text style={styles.diaData}>{isoParaBR(dia.data)}</Text>
                {!!total && <Text style={styles.diaTotal}>{total}</Text>}
              </View>
              <TouchableOpacity onPress={() => removerDia(dia.data)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={16} color="#f87171" />
              </TouchableOpacity>
            </View>

            {dia.periodos.map((periodo, i) => (
              <View key={i} style={styles.periodoRow}>
                <View style={styles.horaGroup}>
                  <Text style={styles.horaLabel}>Entrada</Text>
                  <TextInput
                    style={styles.horaInput}
                    placeholder="08:00"
                    placeholderTextColor="#374151"
                    value={periodo.entrada}
                    onChangeText={(v) => atualizarHora(dia.data, i, 'entrada', v)}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <Ionicons name="arrow-forward" size={14} color="#374151" style={{ marginTop: 18 }} />
                <View style={styles.horaGroup}>
                  <Text style={styles.horaLabel}>Saída</Text>
                  <TextInput
                    style={styles.horaInput}
                    placeholder="13:00"
                    placeholderTextColor="#374151"
                    value={periodo.saida}
                    onChangeText={(v) => atualizarHora(dia.data, i, 'saida', v)}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                {dia.periodos.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removerPeriodo(dia.data, i)}
                    style={styles.removerPeriodo}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={18} color="#f87171" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addPeriodoBotao} onPress={() => adicionarPeriodo(dia.data)} activeOpacity={0.8}>
              <Ionicons name="add" size={14} color="#d97706" />
              <Text style={styles.addPeriodoTexto}>Adicionar período</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {adicionandoData ? (
        <View style={styles.novaDataForm}>
          <TextInput
            style={styles.novaDataInput}
            placeholder="DD/MM/AAAA"
            placeholderTextColor="#475569"
            value={novaData}
            onChangeText={(v) => setNovaData(formatarDataInput(v))}
            keyboardType="numeric"
            maxLength={10}
            autoFocus
          />
          <TouchableOpacity style={styles.confirmarBtn} onPress={adicionarData} activeOpacity={0.8}>
            <Ionicons name="checkmark" size={18} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setAdicionandoData(false); setNovaData(''); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={18} color="#64748b" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.addDataBotao} onPress={() => setAdicionandoData(true)} activeOpacity={0.8}>
          <Ionicons name="calendar-outline" size={16} color="#d97706" />
          <Text style={styles.addDataTexto}>Adicionar data de execução</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  diaCard: {
    backgroundColor: '#0b1220',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d9770633',
  },
  diaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  diaHeaderEsq: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  diaData: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  diaTotal: {
    color: '#d97706', fontSize: 11, fontWeight: '700',
    backgroundColor: '#d9770622', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  periodoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  horaGroup: { flex: 1 },
  horaLabel: { color: '#64748b', fontSize: 11, marginBottom: 4 },
  horaInput: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  removerPeriodo: { marginBottom: 8 },
  addPeriodoBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  addPeriodoTexto: { color: '#d97706', fontSize: 12, fontWeight: '600' },
  novaDataForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  novaDataInput: {
    flex: 1,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
  },
  confirmarBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: '#d97706', alignItems: 'center', justifyContent: 'center',
  },
  addDataBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d9770611',
    borderWidth: 1,
    borderColor: '#d9770644',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  addDataTexto: { color: '#d97706', fontSize: 13, fontWeight: '600' },
});
