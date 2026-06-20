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
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const usuariosTeste = [
  { nome: 'Técnico Teste', email: 'teste@servios.com', senha: '123456' },
];

type Props = {
  onLoginSuccess: (nome: string) => void;
};

export default function LoginScreen({ onLoginSuccess }: Props) {
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [larguraToggle, setLarguraToggle] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const scaleBotao = useRef(new Animated.Value(1)).current;
  const indicadorAnim = useRef(new Animated.Value(0)).current;

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

  function onToggleLayout(e: LayoutChangeEvent) {
    setLarguraToggle(e.nativeEvent.layout.width);
  }

  function trocarModo(novoModo: 'login' | 'cadastro') {
    setModo(novoModo);
    Animated.spring(indicadorAnim, {
      toValue: novoModo === 'login' ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }

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

  function handleLogin() {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    setCarregando(true);
    setTimeout(() => {
      setCarregando(false);
      const usuario = usuariosTeste.find(
        (u) => u.email === email && u.senha === senha
      );
      if (usuario) {
        onLoginSuccess(usuario.nome);
      } else {
        Alert.alert('Erro', 'E-mail ou senha incorretos.');
      }
    }, 700);
  }

  function handleCadastro() {
    if (!nome || !email || !senha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('Atenção', 'A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (usuariosTeste.some((u) => u.email === email)) {
      Alert.alert('Atenção', 'Já existe uma conta com esse e-mail.');
      return;
    }
    setCarregando(true);
    setTimeout(() => {
      setCarregando(false);
      usuariosTeste.push({ nome, email, senha });
      Alert.alert('Sucesso', 'Conta criada! Agora faça login.', [
        { text: 'OK', onPress: () => trocarModo('login') },
      ]);
      setNome('');
      setSenha('');
      setConfirmarSenha('');
    }, 700);
  }

  const metadeToggle = larguraToggle / 2;
  const indicadorTranslate = indicadorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, metadeToggle],
  });

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
            <Ionicons name="construct" size={28} color="#ffffff" />
          </View>
          <Text style={styles.logo}>ServiOS</Text>
          <Text style={styles.tagline}>Gestão de Serviços Técnicos</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Toggle */}
          <View
            style={styles.toggleContainer}
            onLayout={onToggleLayout}
          >
            {larguraToggle > 0 && (
              <Animated.View
                style={[
                  styles.toggleIndicator,
                  {
                    width: metadeToggle - 4,
                    transform: [{ translateX: indicadorTranslate }],
                  },
                ]}
              />
            )}
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => trocarModo('login')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleText,
                  modo === 'login' && styles.toggleTextAtivo,
                ]}
              >
                Entrar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => trocarModo('cadastro')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleText,
                  modo === 'cadastro' && styles.toggleTextAtivo,
                ]}
              >
                Criar conta
              </Text>
            </TouchableOpacity>
          </View>

          {modo === 'cadastro' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome completo</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome"
                  placeholderTextColor="#475569"
                  value={nome}
                  onChangeText={setNome}
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor="#475569"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#475569"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
              />
            </View>
          </View>

          {modo === 'cadastro' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar senha</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#475569"
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  secureTextEntry
                />
              </View>
            </View>
          )}

          <Animated.View style={{ transform: [{ scale: scaleBotao }], marginTop: 8 }}>
            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                animarToque(modo === 'login' ? handleLogin : handleCadastro)
              }
              disabled={carregando}
              activeOpacity={0.9}
            >
              <Text style={styles.buttonText}>
                {carregando
                  ? 'Aguarde...'
                  : modo === 'login'
                  ? 'Entrar'
                  : 'Criar conta'}
              </Text>
              {!carregando && (
                <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
              )}
            </TouchableOpacity>
          </Animated.View>

          {modo === 'login' && (
            <Text style={styles.hint}>
              Teste com: teste@servios.com / 123456
            </Text>
          )}
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#2563eb',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  logo: {
    fontSize: 30,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#0b1220',
    borderRadius: 12,
    padding: 4,
    marginBottom: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  toggleIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: '#2563eb',
    borderRadius: 9,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    zIndex: 1,
  },
  toggleText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  toggleTextAtivo: {
    color: '#ffffff',
  },
  inputGroup: {
    marginBottom: 14,
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
    backgroundColor: '#0b1220',
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
  hint: {
    color: '#374151',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
  },
});