import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar, salvar } from '../utils/cloudStorage';
import type { Tecnico } from './TecnicosListScreen';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';

const CARGOS = ['Técnico', 'Mecânico', 'Eletricista', 'Encarregado', 'Supervisor'];

type Props = {
  onVoltar: () => void;
  onSalvo: () => void;
  tecnicoId?: string;  // se passado, modo edição
};

function formatarTelefone(valor: string) {
  const n = valor.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 10) return n.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  return n.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

export default function TecnicoFormScreen({ onVoltar, onSalvo, tecnicoId }: Props) {
  const tema    = useThema();
  const styles  = useMemo(() => criarEstilos(tema), [tema]);
  const editando = !!tecnicoId;

  const [nome,     setNome]     = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargo,    setCargo]    = useState('');
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(editando);

  useEffect(() => {
    if (!editando) return;
    (async () => {
      const lista = (await carregar<Tecnico[]>('tecnicos')) ?? [];
      const tec   = lista.find((t) => t.id === tecnicoId);
      if (tec) { setNome(tec.nome); setTelefone(tec.telefone); setCargo(tec.cargo); }
      setCarregando(false);
    })();
  }, [tecnicoId]);

  async function handleSalvar() {
    if (!nome || !cargo) { Alert.alert('Atenção', 'Preencha nome e cargo.'); return; }
    setSalvando(true);
    const lista = (await carregar<Tecnico[]>('tecnicos')) ?? [];

    if (editando) {
      const nova = lista.map((t) => t.id === tecnicoId ? { ...t, nome, telefone, cargo } : t);
      await salvar('tecnicos', nova);
    } else {
      lista.push({ id: Date.now().toString(), nome, telefone, cargo });
      await salvar('tecnicos', lista);
    }

    setSalvando(false);
    onSalvo();
  }

  async function handleExcluir() {
    if (!editando) return;
    Alert.alert('Excluir Técnico', `Remover ${nome} da equipe?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          const lista  = (await carregar<Tecnico[]>('tecnicos')) ?? [];
          await salvar('tecnicos', lista.filter((t) => t.id !== tecnicoId));
          onSalvo();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={[styles.iconBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Ionicons name="arrow-back" size={20} color={tema.texto} />
        </TouchableOpacity>
        <Text style={[styles.titulo, { color: tema.texto }]}>{editando ? 'Editar Técnico' : 'Novo Técnico'}</Text>
        {editando ? (
          <TouchableOpacity onPress={handleExcluir} style={[styles.iconBtn, { backgroundColor: '#f8717115', borderColor: '#f8717133' }]}>
            <Ionicons name="trash-outline" size={18} color="#f87171" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {carregando ? null : (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: tema.textoSec }]}>Nome completo</Text>
              <View style={[styles.inputWrapper, { backgroundColor: tema.card, borderColor: tema.borda }]}>
                <Ionicons name="person-outline" size={17} color={tema.textoMuted} style={styles.icon} />
                <TextInput
                  style={[styles.input, { color: tema.texto }]}
                  placeholder="Nome do técnico"
                  placeholderTextColor={tema.textoFraco}
                  value={nome}
                  onChangeText={setNome}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: tema.textoSec }]}>Telefone</Text>
              <View style={[styles.inputWrapper, { backgroundColor: tema.card, borderColor: tema.borda }]}>
                <Ionicons name="call-outline" size={17} color={tema.textoMuted} style={styles.icon} />
                <TextInput
                  style={[styles.input, { color: tema.texto }]}
                  placeholder="(41) 99999-9999"
                  placeholderTextColor={tema.textoFraco}
                  value={telefone}
                  onChangeText={(v) => setTelefone(formatarTelefone(v))}
                  keyboardType="numeric"
                  maxLength={15}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: tema.textoSec }]}>Cargo</Text>
              <View style={styles.chips}>
                {CARGOS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, { backgroundColor: tema.card, borderColor: tema.borda }, cargo === c && styles.chipAtivo]}
                    onPress={() => setCargo(c)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipTexto, { color: tema.textoMuted }, cargo === c && styles.chipTextoAtivo]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.botao, { backgroundColor: '#9333ea' }, salvando && { opacity: 0.6 }]}
              onPress={handleSalvar}
              disabled={salvando}
              activeOpacity={0.9}
            >
              <Text style={styles.botaoTexto}>{salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Salvar Técnico'}</Text>
              {!salvando && <Ionicons name="checkmark" size={18} color="#fff" style={{ marginLeft: 6 }} />}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function criarEstilos(t: AppTema) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.fundo },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    },
    iconBtn: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    titulo: { fontSize: 17, fontWeight: '800' },
    scroll: { padding: 20, paddingTop: 4, paddingBottom: 48 },
    inputGroup: { marginBottom: 18 },
    label: { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center',
      borderRadius: 12, borderWidth: 1, paddingHorizontal: 14,
    },
    icon: { marginRight: 8 },
    input: { flex: 1, fontSize: 15, paddingVertical: 13 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    chipAtivo: { backgroundColor: '#9333ea', borderColor: '#9333ea' },
    chipTexto: { fontSize: 13, fontWeight: '500' },
    chipTextoAtivo: { color: '#fff' },
    botao: {
      borderRadius: 13, paddingVertical: 15, flexDirection: 'row',
      alignItems: 'center', justifyContent: 'center', marginTop: 8,
      shadowColor: '#9333ea', shadowOpacity: 0.3, shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    botaoTexto: { color: '#fff', fontSize: 15, fontWeight: '600' },
  });
}
