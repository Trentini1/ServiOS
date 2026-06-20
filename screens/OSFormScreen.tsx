import { useState, useRef, useEffect, useCallback } from 'react';
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
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar, salvar } from '../utils/storage';
import type { OrdemServico } from './OSListScreen';
import type { Cliente } from './ClientListScreen';

const POSICOES = ['BB', 'BE', 'Vante', 'Ré', 'Outro'];
const TIPOS = ['Preventiva', 'Corretiva', 'Revisão', 'Instalação'];

type Props = {
  onVoltar: () => void;
  onSalvo: () => void;
  onIrParaClientes: () => void;
};

export default function OSFormScreen({ onVoltar, onSalvo, onIrParaClientes }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const [motor, setMotor] = useState('');
  const [posicao, setPosicao] = useState('');
  const [tipoManutencao, setTipoManutencao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleBotao = useRef(new Animated.Value(1)).current;

  const carregarClientes = useCallback(async () => {
    const lista = await carregar<Cliente[]>('clientes');
    setClientes(lista ?? []);
  }, []);

  useEffect(() => {
    carregarClientes();
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
    if (!clienteSelecionado || !motor || !posicao || !tipoManutencao) {
      Alert.alert('Atenção', 'Selecione o cliente e preencha motor, posição e tipo de manutenção.');
      return;
    }

    setSalvando(true);

    const novaOS: OrdemServico = {
      id: Date.now().toString(),
      cliente: clienteSelecionado.nome,
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

  function selecionarCliente(cliente: Cliente) {
    setClienteSelecionado(cliente);
    setModalAberto(false);
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

            {clientes.length === 0 ? (
              <TouchableOpacity
                style={styles.avisoSemCliente}
                onPress={onIrParaClientes}
                activeOpacity={0.8}
              >
                <Ionicons name="alert-circle-outline" size={18} color="#d97706" />
                <Text style={styles.avisoTexto}>
                  Nenhum cliente cadastrado. Toque aqui para cadastrar o primeiro.
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.seletorWrapper}
                onPress={() => setModalAberto(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="business-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <Text
                  style={[
                    styles.seletorTexto,
                    !clienteSelecionado && styles.seletorPlaceholder,
                  ]}
                >
                  {clienteSelecionado ? clienteSelecionado.nome : 'Selecionar cliente'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </TouchableOpacity>
            )}
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

      {/* Modal de seleção de cliente */}
      <Modal
        visible={modalAberto}
        animationType="slide"
        transparent
        onRequestClose={() => setModalAberto(false)}
      >
        <View style={styles.modalFundo}>
          <View style={styles.modalConteudo}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Selecionar Cliente</Text>
              <TouchableOpacity onPress={() => setModalAberto(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={clientes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => selecionarCliente(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalItemIcone}>
                    <Ionicons name="business" size={18} color="#16a34a" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalItemNome}>{item.nome}</Text>
                    <Text style={styles.modalItemDetalhe}>
                      {item.cidade}/{item.estado}
                    </Text>
                  </View>
                  {clienteSelecionado?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  seletorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  seletorTexto: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
  },
  seletorPlaceholder: {
    color: '#475569',
  },
  avisoSemCliente: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d9770622',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d9770655',
    padding: 14,
  },
  avisoTexto: {
    color: '#d97706',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  modalFundo: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'flex-end',
  },
  modalConteudo: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  modalTitulo: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  modalItemIcone: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#16a34a22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalItemNome: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalItemDetalhe: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
});