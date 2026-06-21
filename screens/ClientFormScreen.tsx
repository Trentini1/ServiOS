import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar, salvar } from '../utils/cloudStorage';
import type { Cliente } from './ClientListScreen';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';

type Props = { onVoltar: () => void; onSalvo: () => void; clienteId?: string };

function formatarDocumento(valor: string) {
  const numeros = valor.replace(/\D/g, '').slice(0, 14);
  if (numeros.length <= 11) {
    let r = numeros;
    if (numeros.length > 3) r = numeros.replace(/^(\d{3})(\d)/, '$1.$2');
    if (numeros.length > 6) r = r.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    if (numeros.length > 9) r = r.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return r;
  }
  let r = numeros;
  if (numeros.length > 2) r = numeros.replace(/^(\d{2})(\d)/, '$1.$2');
  if (numeros.length > 5) r = r.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
  if (numeros.length > 8) r = r.replace(/\.(\d{3})(\d)/, '.$1/$2');
  if (numeros.length > 12) r = r.replace(/(\d{4})(\d)/, '$1-$2');
  return r;
}

function formatarTelefone(valor: string) {
  const numeros = valor.replace(/\D/g, '').slice(0, 11);
  if (numeros.length <= 10) return numeros.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  return numeros.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

export default function ClientFormScreen({ onVoltar, onSalvo, clienteId }: Props) {
  const tema = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);
  const modoEdicao = !!clienteId;

  const [nome, setNome] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(modoEdicao);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleBotao = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (modoEdicao) {
      (async () => {
        const lista = (await carregar<Cliente[]>('clientes')) ?? [];
        const cliente = lista.find((c) => c.id === clienteId);
        if (cliente) {
          setNome(cliente.nome);
          setCnpjCpf(cliente.cnpjCpf);
          setTelefone(cliente.telefone);
          setCidade(cliente.cidade);
          setEstado(cliente.estado);
          setEmail((cliente as any).email ?? '');
          setEndereco((cliente as any).endereco ?? '');
          setObservacoes((cliente as any).observacoes ?? '');
        }
        setCarregando(false);
      })();
    }
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  function animarToque(callback: () => void) {
    Animated.sequence([
      Animated.timing(scaleBotao, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleBotao, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(callback);
  }

  async function handleSalvar() {
    if (!nome || !cnpjCpf || !telefone || !cidade || !estado) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.'); return;
    }
    if (estado.length !== 2) { Alert.alert('Atenção', 'Digite a sigla do estado (ex: PR, SP).'); return; }
    setSalvando(true);
    const listaAtual = (await carregar<Cliente[]>('clientes')) ?? [];

    if (modoEdicao) {
      const atualizado = listaAtual.map((c) =>
        c.id === clienteId
          ? { ...c, nome, cnpjCpf, telefone, cidade, estado, email, endereco, observacoes } as any
          : c
      );
      await salvar('clientes', atualizado);
    } else {
      const novoCliente: any = { id: Date.now().toString(), nome, cnpjCpf, telefone, cidade, estado, email, endereco, observacoes };
      listaAtual.push(novoCliente);
      await salvar('clientes', listaAtual);
    }

    setSalvando(false);
    onSalvo();
  }

  function confirmarExclusao() {
    Alert.alert('Excluir Cliente', 'Todos os dados deste cliente serão removidos. Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: excluirCliente },
    ]);
  }

  async function excluirCliente() {
    const lista = (await carregar<Cliente[]>('clientes')) ?? [];
    await salvar('clientes', lista.filter((c) => c.id !== clienteId));
    onSalvo();
  }

  if (carregando) return <View style={styles.container} />;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={styles.voltarBotao}>
          <Ionicons name="arrow-back" size={22} color={tema.texto} />
        </TouchableOpacity>
        <Text style={styles.titulo}>{modoEdicao ? 'Editar Cliente' : 'Novo Cliente'}</Text>
        {modoEdicao ? (
          <TouchableOpacity onPress={confirmarExclusao} style={styles.excluirBotao}>
            <Ionicons name="trash-outline" size={18} color="#f87171" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          <Text style={styles.secaoLabel}>Dados Obrigatórios</Text>

          {[
            { label: 'Nome / Razão Social *', valor: nome, setter: setNome, placeholder: 'Ex: SAAM Towage Brasil S.A.', icone: 'business-outline', keyboard: 'default' as const },
            { label: 'CNPJ ou CPF *', valor: cnpjCpf, setter: (v: string) => setCnpjCpf(formatarDocumento(v)), placeholder: '00.000.000/0000-00', icone: 'document-text-outline', keyboard: 'numeric' as const },
            { label: 'Telefone *', valor: telefone, setter: (v: string) => setTelefone(formatarTelefone(v)), placeholder: '(41) 99999-9999', icone: 'call-outline', keyboard: 'numeric' as const },
          ].map(({ label, valor, setter, placeholder, icone, keyboard }) => (
            <View key={label} style={styles.inputGroup}>
              <Text style={styles.label}>{label}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name={icone as any} size={18} color={tema.textoMuted} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder={placeholder} placeholderTextColor={tema.textoFraco}
                  value={valor} onChangeText={setter} keyboardType={keyboard} maxLength={18} />
              </View>
            </View>
          ))}

          <View style={styles.linha}>
            <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
              <Text style={styles.label}>Cidade *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={18} color={tema.textoMuted} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Curitiba" placeholderTextColor={tema.textoFraco}
                  value={cidade} onChangeText={setCidade} />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>UF *</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={[styles.input, { paddingLeft: 14 }]} placeholder="PR"
                  placeholderTextColor={tema.textoFraco} value={estado}
                  onChangeText={(v) => setEstado(v.toUpperCase().slice(0, 2))}
                  autoCapitalize="characters" maxLength={2} />
              </View>
            </View>
          </View>

          <Text style={[styles.secaoLabel, { marginTop: 8 }]}>Informações Adicionais</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={tema.textoMuted} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="contato@empresa.com" placeholderTextColor={tema.textoFraco}
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Endereço</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="map-outline" size={18} color={tema.textoMuted} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Rua, número, bairro" placeholderTextColor={tema.textoFraco}
                value={endereco} onChangeText={setEndereco} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observações</Text>
            <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 10 }]}>
              <Ionicons name="chatbox-outline" size={18} color={tema.textoMuted} style={[styles.inputIcon, { marginTop: 2 }]} />
              <TextInput
                style={[styles.input, { minHeight: 72, textAlignVertical: 'top' }]}
                placeholder="Anotações sobre este cliente..."
                placeholderTextColor={tema.textoFraco}
                value={observacoes}
                onChangeText={setObservacoes}
                multiline
              />
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: scaleBotao }], marginTop: 8 }}>
            <TouchableOpacity style={[styles.button, salvando && { opacity: 0.6 }]}
              onPress={() => animarToque(handleSalvar)} disabled={salvando} activeOpacity={0.9}>
              <Text style={styles.buttonText}>{salvando ? 'Salvando...' : modoEdicao ? 'Salvar Alterações' : 'Salvar Cliente'}</Text>
              {!salvando && <Ionicons name="checkmark" size={18} color="#ffffff" style={{ marginLeft: 6 }} />}
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
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    },
    voltarBotao: {
      width: 36, height: 36, borderRadius: 10, backgroundColor: t.card,
      borderWidth: 1, borderColor: t.borda, alignItems: 'center', justifyContent: 'center',
    },
    excluirBotao: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: '#f8717115', borderWidth: 1, borderColor: '#f8717133',
      alignItems: 'center', justifyContent: 'center',
    },
    titulo: { color: t.texto, fontSize: 17, fontWeight: '700' },
    scrollContent: { padding: 20, paddingTop: 4, paddingBottom: 40 },
    secaoLabel: {
      color: t.textoMuted, fontSize: 11, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 4,
    },
    inputGroup: { marginBottom: 16 },
    label: { color: t.textoSec, fontSize: 12, marginBottom: 6, fontWeight: '500' },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: t.card,
      borderRadius: 10, borderWidth: 1, borderColor: t.borda, paddingHorizontal: 14,
    },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, color: t.texto, fontSize: 15, paddingVertical: 13 },
    linha: { flexDirection: 'row' },
    button: {
      backgroundColor: '#16a34a', borderRadius: 10, paddingVertical: 15,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    buttonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  });
}
