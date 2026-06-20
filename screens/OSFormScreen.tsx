import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar, salvar } from '../utils/storage';
import type { OrdemServico } from './OSListScreen';

const POSICOES = ['BB', 'BE', 'Vante', 'Ré', 'Outro'];
const TIPOS = ['Preventiva', 'Corretiva', 'Revisão', 'Instalação'];

type Props = {
  onVoltar: () => void;
  onSalvo: () => void;
};

export default function OSFormScreen({ onVoltar, onSalvo }: Props) {
  const [cliente, setCliente] = useState('');
  const [motor, setMotor] = useState('');
  const [posicao, setPosicao] = useState('');
  const [tipoManutencao, setTipoManutencao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleBotao = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  function animarToque(callback: () => void) {
    Animated.sequence([
      Animated.timing(scaleBotao, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleBotao, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(callback);
  }

  async function handleSalvar() {
    if (!cliente || !motor || !posicao || !tipoManutencao) {
      Alert.alert('Atenção', 'Preencha cliente, motor, posição e tipo de manutenção.');
      return;
    }

    setSalvando(true);

    const novaOS: OrdemServico = {
      id: Date.now().toString(),
      cliente,
      motor,
      posicao,
      tipoManutencao,
      descricao,
      status: 'Aberta',
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
    };

    const listaAtual = (await carregar<OrdemServico[]>('ordensServico')) ?? [];
    listaAtual.push(novaOS);
    await salvar('ordensServico', listaAtual);

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
        <Text style={styles.titulo}>Nova Ordem de Serviço</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cliente</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="business-outline" size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nome do cliente"
                placeholderTextColor="#475569"
                value={cliente}
                onChangeText={setCliente}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Motor / Equipamento</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="cog-outline" size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Motor Volvo Penta D13"
                placeholderTextColor="#475569"
                value={motor}
                onChangeText={setMotor}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Posição</Text>
            <View style={styles.chipsContainer}>
              {POSICOES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, posicao === p && styles.chipAtivo]}
                  onPress={() => setPosicao(p)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, posicao === p && styles.chipTextAtivo]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de manutenção</Text>
            <View style={styles.chipsContainer}>
              {TIPOS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, tipoManutencao === t && styles.chipAtivo]}
                  onPress={() => setTipoManutencao(t)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, tipoManutencao === t && styles.chipTextAtivo]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição do serviço</Text>
            <View style={[styles.inputWrapper, styles.textareaWrapper]}>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Descreva o serviço a ser realizado..."
                placeholderTextColor="#475569"
                value={descricao}
                onChangeText={setDescricao}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: scaleBotao }], marginTop: 8 }}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => animarToque(handleSalvar)}
              disabled={salvando}
              activeOpacity={0.9}
            >
              <Text style={styles.buttonText}>
                {salvando ? 'Salvando...' : 'Salvar Ordem de Serviço'}
              </Text>
              {!salvando && (
                <Ionicons name="checkmark" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  voltarBotao: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    paddingVertical: 13,
  },
  textareaWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  textarea: {
    minHeight: 90,
    paddingVertical: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  chipAtivo: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextAtivo: {
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});