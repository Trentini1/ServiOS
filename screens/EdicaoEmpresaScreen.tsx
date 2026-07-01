import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregarEmpresa, salvarEmpresa } from '../utils/cloudStorage';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';

type Props = { uid: string; onVoltar: () => void };

type Empresa = {
  nome: string;
  cnpj: string;
  telefone: string;
  segmento?: string;
  cidade?: string;
  estado?: string;
  email?: string;
  endereco?: string;
};

export default function EdicaoEmpresaScreen({ uid, onVoltar }: Props) {
  const tema = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);

  const [form, setForm] = useState<Empresa>({
    nome: '', cnpj: '', telefone: '', email: '', endereco: '',
  });
  const [empresaBase, setEmpresaBase] = useState<Empresa>({} as Empresa);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarEmpresa(uid).then((e) => {
      if (e) {
        setEmpresaBase(e);
        setForm({ nome: e.nome, cnpj: e.cnpj ?? '', telefone: e.telefone ?? '', email: e.email ?? '', endereco: e.endereco ?? '' });
      }
    });
  }, [uid]);

  function atualizar(campo: keyof Empresa, valor: string) {
    setForm((p) => ({ ...p, [campo]: valor }));
  }

  async function handleSalvar() {
    if (!form.nome.trim()) {
      Alert.alert('Campo obrigatório', 'O nome da empresa é obrigatório.');
      return;
    }
    setSalvando(true);
    await salvarEmpresa(uid, { ...empresaBase, ...form });
    setSalvando(false);
    Alert.alert('Salvo!', 'Dados da empresa atualizados com sucesso.', [
      { text: 'OK', onPress: onVoltar },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={styles.voltarBotao}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Dados da Empresa</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {[
          { chave: 'nome' as const, label: 'Nome da Empresa *', placeholder: 'Nome da empresa', icone: 'business-outline', keyboard: 'default' as const },
          { chave: 'cnpj' as const, label: 'CNPJ', placeholder: '00.000.000/0000-00', icone: 'document-text-outline', keyboard: 'numeric' as const },
          { chave: 'telefone' as const, label: 'Telefone', placeholder: '(00) 00000-0000', icone: 'call-outline', keyboard: 'phone-pad' as const },
          { chave: 'email' as const, label: 'E-mail', placeholder: 'contato@empresa.com', icone: 'mail-outline', keyboard: 'email-address' as const },
          { chave: 'endereco' as const, label: 'Endereço', placeholder: 'Rua, número, cidade', icone: 'location-outline', keyboard: 'default' as const },
        ].map(({ chave, label, placeholder, icone, keyboard }) => (
          <View key={chave} style={styles.campo}>
            <Text style={styles.campoLabel}>{label}</Text>
            <View style={styles.inputRow}>
              <Ionicons name={icone as any} size={18} color={tema.textoMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                value={form[chave]}
                onChangeText={(v) => atualizar(chave, v)}
                placeholder={placeholder}
                placeholderTextColor={tema.textoFraco}
                keyboardType={keyboard}
                autoCapitalize={keyboard === 'email-address' ? 'none' : 'sentences'}
              />
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.salvarBtn, { backgroundColor: tema.primario }, salvando && { opacity: 0.6 }]}
          onPress={handleSalvar}
          disabled={salvando}
          activeOpacity={0.9}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
          <Text style={styles.salvarTexto}>{salvando ? 'Salvando...' : 'Salvar Dados'}</Text>
        </TouchableOpacity>
      </ScrollView>
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
    scroll: { padding: 20, paddingBottom: 40 },
    campo: { marginBottom: 16 },
    campoLabel: { color: t.textoSec, fontSize: 12, fontWeight: '600', marginBottom: 6 },
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: t.card, borderWidth: 1, borderColor: t.borda,
      borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
    },
    input: { flex: 1, color: t.texto, fontSize: 15 },
    salvarBtn: {
      borderRadius: 12, paddingVertical: 15, marginTop: 8,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    salvarTexto: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  });
}
