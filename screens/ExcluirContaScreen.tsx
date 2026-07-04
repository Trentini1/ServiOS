import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';
import { excluirContaCompleta } from '../utils/excluirConta';

type Props = { onVoltar: () => void };

export default function ExcluirContaScreen({ onVoltar }: Props) {
  const tema = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);

  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  function handleGerenciarAssinatura() {
    Linking.openURL('itms-apps://apps.apple.com/account/subscriptions').catch(() => {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    });
  }

  function confirmarExclusao() {
    if (!senha.trim()) {
      Alert.alert('Senha obrigatória', 'Digite sua senha para confirmar.'); return;
    }
    Alert.alert(
      'Excluir conta permanentemente?',
      'Todos os seus dados, clientes, ordens de serviço e fotos serão apagados. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: handleExcluir },
      ]
    );
  }

  async function handleExcluir() {
    const user = auth().currentUser;
    if (!user || !user.email) {
      Alert.alert('Erro', 'Sessão expirada. Faça login novamente.'); return;
    }

    setExcluindo(true);
    try {
      const credencial = auth.EmailAuthProvider.credential(user.email, senha);
      await user.reauthenticateWithCredential(credencial);
      await excluirContaCompleta(user.uid);
    } catch (e: any) {
      const msgs: Record<string, string> = {
        'auth/wrong-password':       'Senha incorreta.',
        'auth/too-many-requests':    'Muitas tentativas. Aguarde alguns minutos.',
        'auth/network-request-failed': 'Sem conexão. Verifique sua internet.',
        'auth/invalid-credential':   'Senha incorreta.',
      };
      Alert.alert('Erro', msgs[e.code] ?? 'Não foi possível excluir a conta. Tente novamente.');
      setExcluindo(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={styles.voltarBotao}>
          <Ionicons name="arrow-back" size={22} color={tema.texto} />
        </TouchableOpacity>
        <Text style={styles.titulo}>Excluir Conta</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.avisoCard, { backgroundColor: '#f8717118', borderColor: '#f8717144' }]}>
          <Ionicons name="warning-outline" size={18} color="#f87171" />
          <Text style={[styles.avisoTexto, { color: tema.texto }]}>
            Esta ação apaga permanentemente sua empresa, clientes, ordens de serviço, fotos e assinaturas.
            Não é possível desfazer.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.gerenciarBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}
          onPress={handleGerenciarAssinatura}
          activeOpacity={0.85}
        >
          <Ionicons name="settings-outline" size={16} color={tema.texto} />
          <Text style={[styles.gerenciarBtnTexto, { color: tema.texto }]}>
            Cancelar assinatura na Apple antes de excluir
          </Text>
        </TouchableOpacity>

        <View style={styles.campo}>
          <Text style={styles.campoLabel}>Confirme sua senha</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={tema.textoMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!verSenha}
              placeholder="••••••••"
              placeholderTextColor={tema.textoFraco}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setVerSenha(!verSenha)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name={verSenha ? 'eye-off-outline' : 'eye-outline'} size={18} color={tema.textoMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.excluirBtn, excluindo && { opacity: 0.6 }]}
          onPress={confirmarExclusao}
          disabled={excluindo}
          activeOpacity={0.9}
        >
          <Ionicons name="trash-outline" size={18} color="#ffffff" />
          <Text style={styles.excluirTexto}>{excluindo ? 'Excluindo...' : 'Excluir minha conta permanentemente'}</Text>
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
    avisoCard: {
      flexDirection: 'row', gap: 10, padding: 14,
      borderRadius: 12, borderWidth: 1, marginBottom: 16,
    },
    avisoTexto: { flex: 1, fontSize: 12, lineHeight: 18 },
    gerenciarBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      borderRadius: 12, borderWidth: 1, paddingVertical: 14, marginBottom: 24,
    },
    gerenciarBtnTexto: { fontSize: 13, fontWeight: '700' },
    campo: { marginBottom: 20 },
    campoLabel: { color: t.textoSec, fontSize: 12, fontWeight: '600', marginBottom: 6 },
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: t.card, borderWidth: 1, borderColor: t.borda,
      borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
    },
    input: { flex: 1, color: t.texto, fontSize: 15 },
    excluirBtn: {
      borderRadius: 12, paddingVertical: 15, backgroundColor: '#dc2626',
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    excluirTexto: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  });
}
