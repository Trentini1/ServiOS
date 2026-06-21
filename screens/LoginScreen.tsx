import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, Animated, ScrollView, LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import auth from '@react-native-firebase/auth';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';

type Usuario = { nome: string; email: string };
type Props = { onLoginSuccess: (usuario: Usuario) => void };

export default function LoginScreen({ onLoginSuccess }: Props) {
  const tema = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);

  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [larguraToggle, setLarguraToggle] = useState(0);

  const fadeAnim      = useRef(new Animated.Value(0)).current;
  const slideAnim     = useRef(new Animated.Value(24)).current;
  const scaleBotao    = useRef(new Animated.Value(1)).current;
  const indicadorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
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
      Animated.timing(scaleBotao, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleBotao, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start(callback);
  }

  function mensagemErroFirebase(code: string): string {
    const msgs: Record<string, string> = {
      'auth/user-not-found':       'E-mail não cadastrado.',
      'auth/wrong-password':       'Senha incorreta.',
      'auth/invalid-credential':   'E-mail ou senha incorretos.',
      'auth/email-already-in-use': 'Já existe uma conta com esse e-mail.',
      'auth/invalid-email':        'E-mail inválido.',
      'auth/too-many-requests':    'Muitas tentativas. Aguarde alguns minutos.',
      'auth/network-request-failed': 'Sem conexão com a internet.',
      'auth/weak-password':        'Senha muito fraca. Use pelo menos 6 caracteres.',
    };
    return msgs[code] ?? 'Erro ao autenticar. Tente novamente.';
  }

  async function handleLogin() {
    if (!email.trim() || !senha) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.'); return;
    }
    setCarregando(true);
    try {
      const cred = await auth().signInWithEmailAndPassword(email.trim().toLowerCase(), senha);
      const displayName = cred.user.displayName ?? email.split('@')[0];
      onLoginSuccess({ nome: displayName, email: cred.user.email ?? email });
    } catch (e: any) {
      Alert.alert('Erro no login', mensagemErroFirebase(e.code));
    } finally {
      setCarregando(false);
    }
  }

  async function handleCadastro() {
    if (!nome.trim() || !email.trim() || !senha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.'); return;
    }
    if (senha.length < 6) {
      Alert.alert('Senha fraca', 'Use pelo menos 6 caracteres.'); return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Senhas diferentes', 'As senhas não coincidem.'); return;
    }
    setCarregando(true);
    try {
      const cred = await auth().createUserWithEmailAndPassword(email.trim().toLowerCase(), senha);
      await cred.user.updateProfile({ displayName: nome.trim() });
      onLoginSuccess({ nome: nome.trim(), email: cred.user.email ?? email });
    } catch (e: any) {
      Alert.alert('Erro ao criar conta', mensagemErroFirebase(e.code));
    } finally {
      setCarregando(false);
    }
  }

  const metade = larguraToggle / 2;
  const indicadorX = indicadorAnim.interpolate({ inputRange: [0, 1], outputRange: [0, metade] });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tema.fundo }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[tema.primario + '30', tema.fundo + '00'] as any}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Animated.View style={[styles.logoArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.logoRing, { borderColor: tema.primario + '44' }]}>
            <LinearGradient
              colors={[tema.primario, tema.primario + 'aa'] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Ionicons name="construct" size={32} color="#ffffff" />
            </LinearGradient>
          </View>
          <Text style={[styles.logoNome, { color: tema.texto }]}>ServiOS</Text>
          <Text style={[styles.logoTagline, { color: tema.textoMuted }]}>Gestão de Serviços Técnicos</Text>
        </Animated.View>

        {/* Card de formulário */}
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: tema.card, borderColor: tema.borda, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Toggle login/cadastro */}
          <View style={[styles.toggle, { backgroundColor: tema.inputFundo }]} onLayout={onToggleLayout}>
            {larguraToggle > 0 && (
              <Animated.View
                style={[
                  styles.toggleIndicador,
                  { width: metade - 4, backgroundColor: tema.primario, transform: [{ translateX: indicadorX }] },
                ]}
              />
            )}
            {(['login', 'cadastro'] as const).map((m) => (
              <TouchableOpacity key={m} style={styles.toggleBtn} onPress={() => trocarModo(m)} activeOpacity={0.9}>
                <Text style={[styles.toggleTexto, modo === m && styles.toggleTextoAtivo]}>
                  {m === 'login' ? 'Entrar' : 'Criar conta'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Campos */}
          {modo === 'cadastro' && (
            <InputField
              icone="person-outline"
              placeholder="Nome completo"
              value={nome}
              onChangeText={setNome}
              tema={tema}
            />
          )}
          <InputField
            icone="mail-outline"
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            tema={tema}
          />
          <InputField
            icone="lock-closed-outline"
            placeholder="••••••••"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!verSenha}
            tema={tema}
            direita={
              <TouchableOpacity onPress={() => setVerSenha(!verSenha)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={verSenha ? 'eye-off-outline' : 'eye-outline'} size={18} color={tema.textoMuted} />
              </TouchableOpacity>
            }
          />
          {modo === 'cadastro' && (
            <InputField
              icone="lock-closed-outline"
              placeholder="Confirmar senha"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry={!verSenha}
              tema={tema}
            />
          )}

          {/* Botão */}
          <Animated.View style={{ transform: [{ scale: scaleBotao }], marginTop: 6 }}>
            <TouchableOpacity
              onPress={() => animarToque(modo === 'login' ? handleLogin : handleCadastro)}
              disabled={carregando}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[tema.primario, tema.primario + 'cc'] as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.botao}
              >
                {carregando
                  ? <Text style={styles.botaoTexto}>Aguarde...</Text>
                  : <>
                      <Text style={styles.botaoTexto}>{modo === 'login' ? 'Entrar' : 'Criar conta'}</Text>
                      <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {modo === 'login' && (
            <TouchableOpacity
              onPress={() => {
                if (!email.trim()) { Alert.alert('Atenção', 'Digite seu e-mail acima.'); return; }
                auth().sendPasswordResetEmail(email.trim().toLowerCase())
                  .then(() => Alert.alert('E-mail enviado', 'Verifique sua caixa de entrada para redefinir a senha.'))
                  .catch(() => Alert.alert('Erro', 'Não foi possível enviar o e-mail. Verifique o endereço.'));
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.hint, { color: tema.primario }]}>Esqueceu a senha?</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type InputFieldProps = {
  icone: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences';
  keyboardType?: 'default' | 'email-address';
  tema: AppTema;
  direita?: React.ReactNode;
};

function InputField({ icone, placeholder, value, onChangeText, secureTextEntry, autoCapitalize, keyboardType, tema, direita }: InputFieldProps) {
  const borderAnim = useRef(new Animated.Value(0)).current;

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [tema.borda, tema.primario + 'aa'],
  });

  return (
    <Animated.View style={[{
      flexDirection: 'row', alignItems: 'center', borderRadius: 12,
      borderWidth: 1, borderColor, backgroundColor: tema.inputFundo,
      paddingHorizontal: 14, marginBottom: 12,
    }]}>
      <Ionicons name={icone as any} size={18} color={tema.textoMuted} style={{ marginRight: 10 }} />
      <TextInput
        style={{ flex: 1, color: tema.texto, fontSize: 15, paddingVertical: 14 }}
        placeholder={placeholder}
        placeholderTextColor={tema.textoFraco}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        keyboardType={keyboardType ?? 'default'}
        onFocus={() => Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start()}
        onBlur={() => Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start()}
      />
      {direita}
    </Animated.View>
  );
}

function criarEstilos(t: AppTema) {
  return StyleSheet.create({
    container: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
    logoArea: { alignItems: 'center', marginBottom: 36 },
    logoRing: {
      width: 88, height: 88, borderRadius: 26, borderWidth: 2,
      alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    },
    logoGradient: {
      width: 76, height: 76, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: t.primario, shadowOpacity: 0.5, shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 }, elevation: 8,
    },
    logoNome: { fontSize: 32, fontWeight: '800', letterSpacing: -0.8 },
    logoTagline: { fontSize: 13, marginTop: 6 },
    card: {
      borderRadius: 22, padding: 22, borderWidth: 1,
      shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 }, elevation: 6,
    },
    toggle: {
      flexDirection: 'row', borderRadius: 13, padding: 4,
      marginBottom: 20, position: 'relative', overflow: 'hidden',
    },
    toggleIndicador: {
      position: 'absolute', top: 4, left: 4, bottom: 4, borderRadius: 10,
    },
    toggleBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', zIndex: 1 },
    toggleTexto: { color: t.textoMuted, fontWeight: '600', fontSize: 14 },
    toggleTextoAtivo: { color: '#ffffff' },
    botao: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      borderRadius: 14, paddingVertical: 16,
      shadowColor: t.primario, shadowOpacity: 0.35, shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    botaoTexto: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
    hint: { textAlign: 'center', fontSize: 12, marginTop: 14, fontWeight: '600' },
  });
}
