import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar, salvar } from '../utils/storage';
import type { Tecnico } from './TecnicosListScreen';

const CARGOS = ['Técnico', 'Mecânico', 'Eletricista', 'Encarregado', 'Supervisor'];

type Props = {
  onVoltar: () => void;
  onSalvo: () => void;
};

function formatarTelefone(valor: string) {
  const numeros = valor.replace(/\D/g, '').slice(0, 11);
  if (numeros.length <= 10) {
    return numeros.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return numeros.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

export default function TecnicoFormScreen({ onVoltar, onSalvo }: Props) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargo, setCargo] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function handleSalvar() {
    if (!nome || !cargo) {
      Alert.alert('Atenção', 'Preencha nome e cargo.');
      return;
    }
    setSalvando(true);
    const novoTecnico: Tecnico = {
      id: Date.now().toString(),
      nome,
      telefone,
      cargo,
    };
    const lista = (await carregar<Tecnico[]>('tecnicos')) ?? [];
    lista.push(novoTecnico);
    await salvar('tecnicos', lista);
    setSalvando(false);
    onSalvo();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={styles.voltarBotao}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Novo Técnico</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome completo</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color="#64748b" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Nome do técnico"
              placeholderTextColor="#475569"
              value={nome}
              onChangeText={setNome}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Telefone</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={18} color="#64748b" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="(41) 99999-9999"
              placeholderTextColor="#475569"
              value={telefone}
              onChangeText={(v) => setTelefone(formatarTelefone(v))}
              keyboardType="numeric"
              maxLength={15}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cargo</Text>
          <View style={styles.chips}>
            {CARGOS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, cargo === c && styles.chipAtivo]}
                onPress={() => setCargo(c)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipTexto, cargo === c && styles.chipTextoAtivo]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.botao, salvando && { opacity: 0.6 }]}
          onPress={handleSalvar}
          disabled={salvando}
          activeOpacity={0.9}
        >
          <Text style={styles.botaoTexto}>{salvando ? 'Salvando...' : 'Salvar Técnico'}</Text>
          {!salvando && <Ionicons name="checkmark" size={18} color="#ffffff" style={{ marginLeft: 6 }} />}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scroll: { padding: 20, paddingTop: 4, paddingBottom: 40 },
  inputGroup: { marginBottom: 18 },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '500', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111827', borderRadius: 10,
    borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 14,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, color: '#ffffff', fontSize: 15, paddingVertical: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937',
  },
  chipAtivo: { backgroundColor: '#9333ea', borderColor: '#9333ea' },
  chipTexto: { color: '#64748b', fontSize: 13, fontWeight: '500' },
  chipTextoAtivo: { color: '#ffffff' },
  botao: {
    backgroundColor: '#9333ea', borderRadius: 10, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 8, shadowColor: '#9333ea', shadowOpacity: 0.3,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  botaoTexto: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
