import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PecaUtilizada } from '../screens/OSListScreen';

type Props = {
  pecas: PecaUtilizada[];
  onChange: (pecas: PecaUtilizada[]) => void;
};

const UNIDADES = ['un', 'L', 'kg', 'm', 'par', 'cx'];

type FormState = { descricao: string; quantidade: string; unidade: string; fornecedor: string };
const FORM_VAZIO: FormState = { descricao: '', quantidade: '', unidade: 'un', fornecedor: '' };

export default function PecasUtilizadas({ pecas, onChange }: Props) {
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [adicionando, setAdicionando] = useState(false);

  function handleAdicionar() {
    if (!form.descricao.trim()) {
      Alert.alert('Atenção', 'Informe a descrição da peça.');
      return;
    }
    const nova: PecaUtilizada = {
      id: Date.now().toString(),
      descricao: form.descricao.trim(),
      quantidade: form.quantidade || '1',
      unidade: form.unidade,
      fornecedor: form.fornecedor.trim(),
    };
    onChange([...pecas, nova]);
    setForm(FORM_VAZIO);
    setAdicionando(false);
  }

  function remover(id: string) {
    Alert.alert('Remover peça', 'Deseja remover esta peça?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => onChange(pecas.filter((p) => p.id !== id)) },
    ]);
  }

  return (
    <View>
      {pecas.map((peca) => (
        <View key={peca.id} style={styles.pecaCard}>
          <View style={styles.pecaIcone}>
            <Ionicons name="build-outline" size={16} color="#0891b2" />
          </View>
          <View style={styles.pecaInfo}>
            <Text style={styles.pecaDescricao}>{peca.descricao}</Text>
            <View style={styles.pecaDetalhes}>
              <Text style={styles.pecaQty}>{peca.quantidade} {peca.unidade}</Text>
              {!!peca.fornecedor && (
                <>
                  <Text style={styles.separador}>·</Text>
                  <Ionicons name="business-outline" size={11} color="#64748b" />
                  <Text style={styles.pecaFornecedor}>{peca.fornecedor}</Text>
                </>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => remover(peca.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color="#f87171" />
          </TouchableOpacity>
        </View>
      ))}

      {adicionando ? (
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.formLabel}>Descrição da peça *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Óleo de motor 15W40"
              placeholderTextColor="#475569"
              value={form.descricao}
              onChangeText={(v) => setForm({ ...form, descricao: v })}
              autoFocus
            />
          </View>

          <View style={styles.linha}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.formLabel}>Quantidade</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#475569"
                value={form.quantidade}
                onChangeText={(v) => setForm({ ...form, quantidade: v })}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Unidade</Text>
              <View style={styles.unidadesRow}>
                {UNIDADES.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unidadeChip, form.unidade === u && styles.unidadeChipAtivo]}
                    onPress={() => setForm({ ...form, unidade: u })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.unidadeTexto, form.unidade === u && styles.unidadeTextoAtivo]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.formLabel}>Fornecedor</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Distribuidora Santos"
              placeholderTextColor="#475569"
              value={form.fornecedor}
              onChangeText={(v) => setForm({ ...form, fornecedor: v })}
            />
          </View>

          <View style={styles.formBotoes}>
            <TouchableOpacity
              style={styles.cancelarBtn}
              onPress={() => { setAdicionando(false); setForm(FORM_VAZIO); }}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.salvarBtn} onPress={handleAdicionar} activeOpacity={0.8}>
              <Ionicons name="checkmark" size={16} color="#ffffff" />
              <Text style={styles.salvarTexto}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.addBotao} onPress={() => setAdicionando(true)} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={16} color="#0891b2" />
          <Text style={styles.addTexto}>Adicionar peça</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pecaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b1220',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#0891b233',
    gap: 10,
  },
  pecaIcone: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#0891b222', alignItems: 'center', justifyContent: 'center',
  },
  pecaInfo: { flex: 1 },
  pecaDescricao: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  pecaDetalhes: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  pecaQty: { color: '#0891b2', fontSize: 12, fontWeight: '700' },
  separador: { color: '#374151', fontSize: 12 },
  pecaFornecedor: { color: '#64748b', fontSize: 12 },
  form: {
    backgroundColor: '#0b1220',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginTop: 4,
  },
  inputGroup: { marginBottom: 10 },
  formLabel: { color: '#64748b', fontSize: 11, fontWeight: '500', marginBottom: 4 },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#ffffff',
    fontSize: 14,
  },
  linha: { flexDirection: 'row' },
  unidadesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  unidadeChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
    backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937',
  },
  unidadeChipAtivo: { backgroundColor: '#0891b2', borderColor: '#0891b2' },
  unidadeTexto: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  unidadeTextoAtivo: { color: '#ffffff' },
  formBotoes: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cancelarBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937',
    alignItems: 'center',
  },
  cancelarTexto: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  salvarBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: '#0891b2', alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 4,
  },
  salvarTexto: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  addBotao: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#0891b211', borderWidth: 1, borderColor: '#0891b244',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginTop: 4,
  },
  addTexto: { color: '#0891b2', fontSize: 13, fontWeight: '600' },
});
