import { useState, useRef, useEffect, useMemo } from 'react';
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
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';

const SEGMENTOS = [
  'Manutenção Naval',
  'Manutenção Automotiva',
  'Manutenção Industrial',
  'Outro',
];

type Props = {
  onConcluir: (empresa: {
    nome: string;
    cnpj: string;
    telefone: string;
    segmento: string;
    cidade: string;
    estado: string;
  }) => void;
};

// Aplica máscara de CNPJ enquanto digita: 00.000.000/0000-00
function formatarCNPJ(valor: string) {
  const numeros = valor.replace(/\D/g, '').slice(0, 14);
  let resultado = numeros;
  if (numeros.length > 2) resultado = numeros.replace(/^(\d{2})(\d)/, '$1.$2');
  if (numeros.length > 5)
    resultado = resultado.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
  if (numeros.length > 8)
    resultado = resultado.replace(/\.(\d{3})(\d)/, '.$1/$2');
  if (numeros.length > 12)
    resultado = resultado.replace(/(\d{4})(\d)/, '$1-$2');
  return resultado;
}

function formatarTelefone(valor: string) {
  const numeros = valor.replace(/\D/g, '').slice(0, 11);
  if (numeros.length <= 10) {
    return numeros.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return numeros.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

export default function CompanyRegisterScreen({ onConcluir }: Props) {
  const tema = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [segmento, setSegmento] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [carregando, setCarregando] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const scaleBotao = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 550,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  function animarToque(callback: () => void) {
    Animated.sequence([
      Animated.timing(scaleBotao, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleBotao, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start(callback);
  }

  function handleConcluir() {
    if (!nome || !cnpj || !telefone || !segmento || !cidade || !estado) {
      Alert.alert('Atenção', 'Preencha todos os campos antes de continuar.');
      return;
    }
    if (cnpj.replace(/\D/g, '').length !== 14) {
      Alert.alert('Atenção', 'Digite um CNPJ válido.');
      return;
    }
    if (estado.length !== 2) {
      Alert.alert('Atenção', 'Digite a sigla do estado (ex: PR, SP).');
      return;
    }

    setCarregando(true);
    setTimeout(() => {
      setCarregando(false);
      onConcluir({ nome, cnpj, telefone, segmento, cidade, estado });
    }, 700);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.logoBadge}>
            <Ionicons name="business" size={26} color="#ffffff" />
          </View>
          <Text style={styles.titulo}>Dados da Empresa</Text>
          <Text style={styles.tagline}>
            Vamos configurar o perfil da sua empresa no ServiOS
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome da empresa</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="business-outline" size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: F Milleck Serviços"
                placeholderTextColor="#475569"
                value={nome}
                onChangeText={setNome}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CNPJ</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="document-text-outline" size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="00.000.000/0000-00"
                placeholderTextColor="#475569"
                value={cnpj}
                onChangeText={(v) => setCnpj(formatarCNPJ(v))}
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Segmento de atuação</Text>
            <View style={styles.chipsContainer}>
              {SEGMENTOS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, segmento === s && styles.chipAtivo]}
                  onPress={() => setSegmento(s)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chipText,
                      segmento === s && styles.chipTextAtivo,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
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

          <Animated.View style={{ transform: [{ scale: scaleBotao }], marginTop: 10 }}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => animarToque(handleConcluir)}
              disabled={carregando}
              activeOpacity={0.9}
            >
              <Text style={styles.buttonText}>
                {carregando ? 'Salvando...' : 'Continuar'}
              </Text>
              {!carregando && (
                <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function criarEstilos(t: AppTema) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.fundo },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    header: { alignItems: 'center', marginBottom: 24 },
    logoBadge: {
      width: 56, height: 56, borderRadius: 16, backgroundColor: t.primario,
      alignItems: 'center', justifyContent: 'center', marginBottom: 14,
      shadowColor: t.primario, shadowOpacity: 0.4, shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    titulo: { fontSize: 24, fontWeight: '700', color: t.texto, textAlign: 'center' },
    tagline: { fontSize: 13, color: t.textoMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 16 },
    card: { backgroundColor: t.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: t.borda },
    inputGroup: { marginBottom: 14 },
    label: { color: t.textoSec, fontSize: 12, marginBottom: 6, fontWeight: '500' },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: t.inputFundo,
      borderRadius: 10, borderWidth: 1, borderColor: t.borda, paddingHorizontal: 14,
    },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, color: t.texto, fontSize: 15, paddingVertical: 13 },
    linha: { flexDirection: 'row' },
    chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
      backgroundColor: t.fundo, borderWidth: 1, borderColor: t.borda,
    },
    chipAtivo: { backgroundColor: t.primario, borderColor: t.primario },
    chipText: { color: t.textoMuted, fontSize: 13, fontWeight: '500' },
    chipTextAtivo: { color: '#ffffff' },
    button: {
      backgroundColor: t.primario, borderRadius: 10, paddingVertical: 15,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      shadowColor: t.primario, shadowOpacity: 0.3, shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    buttonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  });
}