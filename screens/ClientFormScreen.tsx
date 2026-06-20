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
import type { Cliente } from './ClientListScreen';

type Props = {
  onVoltar: () => void;
  onSalvo: () => void;
};

function formatarDocumento(valor: string) {
  const numeros = valor.replace(/\D/g, '').slice(0, 14);
  if (numeros.length <= 11) {
    // CPF: 000.000.000-00
    let r = numeros;
    if (numeros.length > 3) r = numeros.replace(/^(\d{3})(\d)/, '$1.$2');
    if (numeros.length > 6) r = r.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    if (numeros.length > 9) r = r.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return r;
  }
  // CNPJ: 00.000.000/0000-00
  let r = numeros;
  if (numeros.length > 2) r = numeros.replace(/^(\d{2})(\d)/, '$1.$2');
  if (numeros.length > 5) r = r.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
  if (numeros.length > 8) r = r.replace(/\.(\d{3})(\d)/, '.$1/$2');
  if (numeros.length > 12) r = r.replace(/(\d{4})(\d)/, '$1-$2');
  return r;
}

function formatarTelefone(valor: string) {
  const numeros = valor.replace(/\D/g, '').slice(0, 11);
  if (numeros.length <= 10) {
    return numeros.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return numeros.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

export default function ClientFormScreen({ onVoltar, onSalvo }: Props) {
  const [nome, setNome] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
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
    if (!nome || !cnpjCpf || !telefone || !cidade || !estado) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (estado.length !== 2) {
      Alert.alert('Atenção', 'Digite a sigla do estado (ex: PR, SP).');
      return;
    }

    setSalvando(true);

    const novoCliente: Cliente = {
      id: Date.now().toString(),
      nome,
      cnpjCpf,
      telefone,
      cidade,
      estado,
    };

    const listaAtual = (await carregar<Cliente[]>('clientes')) ?? [];
    listaAtual.push(novoCliente);
    await salvar('clientes', listaAtual);

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
        <Text style={styles.titulo}>Novo Cliente</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome / Razão Social</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="business-outline" size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: SAAM Towage Brasil S.A."
                placeholderTextColor="#475569"
                value={nome}
                onChangeText={setNome}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CNPJ ou CPF</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="document-text-outline" size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="00.000.000/0000-00"
                placeholderTextColor="#475569"
                value={cnpjCpf}
                onChangeText={(v) => setCnpjCpf(formatarDocumento(v))}
                keyboardType="numeric"
                maxLength={18}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color="#64748b" style={styles.inputIcon} />
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

          <View style={styles.linha}>
            <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
              <Text style={styles.label}>Cidade</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Curitiba"
                  placeholderTextColor="#475569"
                  value={cidade}
                  onChangeText={setCidade}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>UF</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { paddingLeft: 14 }]}
                  placeholder="PR"
                  placeholderTextColor="#475569"
                  value={estado}
                  onChangeText={(v) => setEstado(v.toUpperCase().slice(0, 2))}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>
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
                {salvando ? 'Salvando...' : 'Salvar Cliente'}
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
  linha: {
    flexDirection: 'row',
  },
  button: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
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