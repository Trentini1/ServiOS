import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar, salvar } from '../utils/storage';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';

type Props = { onVoltar: () => void };
type Usuario = { nome: string; email: string; senha: string };

type CampoProps = {
  label: string; value: string; onChange: (v: string) => void;
  ver: boolean; setVer: (v: boolean) => void;
  tema: AppTema;
  styles: ReturnType<typeof criarEstilos>;
};

function Campo({ label, value, onChange, ver, setVer, tema, styles }: CampoProps) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <Ionicons name="lock-closed-outline" size={18} color={tema.textoMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!ver}
          placeholder="••••••••"
          placeholderTextColor={tema.textoFraco}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setVer(!ver)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name={ver ? 'eye-off-outline' : 'eye-outline'} size={18} color={tema.textoMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AlterarSenhaScreen({ onVoltar }: Props) {
  const tema = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verAtual, setVerAtual] = useState(false);
  const [verNova, setVerNova] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function handleSalvar() {
    if (!senhaAtual.trim() || !novaSenha.trim() || !confirmar.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
      return;
    }
    if (novaSenha.length < 6) {
      Alert.alert('Senha fraca', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmar) {
      Alert.alert('Senhas diferentes', 'A nova senha e a confirmação não coincidem.');
      return;
    }

    const usuarioLogado = await carregar<Usuario>('usuarioLogado');
    if (!usuarioLogado) {
      Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
      return;
    }
    if (usuarioLogado.senha !== senhaAtual) {
      Alert.alert('Senha incorreta', 'A senha atual está incorreta.');
      return;
    }

    setSalvando(true);
    const usuarios = await carregar<Usuario[]>('usuarios') ?? [];
    const atualizados = usuarios.map((u) =>
      u.email === usuarioLogado.email ? { ...u, senha: novaSenha } : u
    );
    await salvar('usuarios', atualizados);
    await salvar('usuarioLogado', { ...usuarioLogado, senha: novaSenha });
    setSalvando(false);

    Alert.alert('Senha alterada!', 'Sua senha foi atualizada com sucesso.', [
      { text: 'OK', onPress: onVoltar },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={styles.voltarBotao}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Alterar Senha</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoCard, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={tema.primario} />
          <Text style={[styles.infoTexto, { color: tema.textoSec }]}>
            Use uma senha com pelo menos 6 caracteres, com letras e números.
          </Text>
        </View>

        <Campo label="Senha atual" value={senhaAtual} onChange={setSenhaAtual} ver={verAtual} setVer={setVerAtual} tema={tema} styles={styles} />
        <Campo label="Nova senha" value={novaSenha} onChange={setNovaSenha} ver={verNova} setVer={setVerNova} tema={tema} styles={styles} />
        <Campo label="Confirmar nova senha" value={confirmar} onChange={setConfirmar} ver={verConfirmar} setVer={setVerConfirmar} tema={tema} styles={styles} />

        {novaSenha && novaSenha !== confirmar && confirmar.length > 0 && (
          <Text style={styles.erroTexto}>As senhas não coincidem</Text>
        )}

        <TouchableOpacity
          style={[styles.salvarBtn, { backgroundColor: tema.primario }, salvando && { opacity: 0.6 }]}
          onPress={handleSalvar}
          disabled={salvando}
          activeOpacity={0.9}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
          <Text style={styles.salvarTexto}>{salvando ? 'Alterando...' : 'Alterar Senha'}</Text>
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
    infoCard: {
      flexDirection: 'row', gap: 8, padding: 14,
      borderRadius: 12, borderWidth: 1, marginBottom: 20,
    },
    infoTexto: { flex: 1, fontSize: 12, lineHeight: 18 },
    campo: { marginBottom: 16 },
    campoLabel: { color: t.textoSec, fontSize: 12, fontWeight: '600', marginBottom: 6 },
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: t.card, borderWidth: 1, borderColor: t.borda,
      borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
    },
    input: { flex: 1, color: t.texto, fontSize: 15 },
    erroTexto: { color: '#f87171', fontSize: 12, marginTop: -10, marginBottom: 12 },
    salvarBtn: {
      borderRadius: 12, paddingVertical: 15, marginTop: 8,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    salvarTexto: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  });
}
