import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar } from '../utils/cloudStorage';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';

export type Cliente = {
  id: string; nome: string; cnpjCpf: string; telefone: string; cidade: string; estado: string;
};

type Props = { onVoltar: () => void; onNovoCliente: () => void; onEditarCliente: (id: string) => void };

function iniciais(nome: string): string {
  return nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

const CORES_AVATAR = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#db2777'];
function corAvatar(id: string): string {
  const soma = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return CORES_AVATAR[soma % CORES_AVATAR.length];
}

export default function ClientListScreen({ onVoltar, onNovoCliente, onEditarCliente }: Props) {
  const tema = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [recarregando, setRecarregando] = useState(false);

  const carregarClientes = useCallback(async () => {
    const lista = await carregar<Cliente[]>('clientes');
    setClientes(lista ?? []);
  }, []);

  useEffect(() => { carregarClientes(); }, [carregarClientes]);

  async function recarregar() {
    setRecarregando(true);
    await carregarClientes();
    setRecarregando(false);
  }

  const clientesFiltrados = useMemo(() => {
    const lista = [...clientes].reverse();
    if (!busca.trim()) return lista;
    const q = busca.toLowerCase();
    return lista.filter((c) =>
      c.nome.toLowerCase().includes(q) ||
      c.cidade.toLowerCase().includes(q) ||
      c.cnpjCpf.includes(q)
    );
  }, [clientes, busca]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={[styles.iconBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Ionicons name="arrow-back" size={20} color={tema.texto} />
        </TouchableOpacity>
        <View>
          <Text style={styles.titulo}>Clientes</Text>
          <Text style={[styles.subtitulo, { color: tema.textoMuted }]}>{clientes.length} cadastrados</Text>
        </View>
        <TouchableOpacity
          onPress={onNovoCliente}
          style={[styles.novoBtn, { backgroundColor: '#16a34a' }]}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Busca */}
      {clientes.length > 0 && (
        <View style={[styles.buscaBox, { backgroundColor: tema.inputFundo, borderColor: tema.borda }]}>
          <Ionicons name="search-outline" size={17} color={tema.textoMuted} />
          <TextInput
            style={[styles.buscaInput, { color: tema.texto }]}
            placeholder="Buscar cliente, cidade, CNPJ..."
            placeholderTextColor={tema.textoFraco}
            value={busca}
            onChangeText={setBusca}
            autoCapitalize="none"
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <Ionicons name="close-circle" size={16} color={tema.textoMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Lista */}
      <FlatList
        data={clientesFiltrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.lista, clientesFiltrados.length === 0 && styles.listaVazia]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={recarregando} onRefresh={recarregar}
            tintColor="#16a34a" colors={['#16a34a']} />
        }
        ListEmptyComponent={
          <View style={styles.vazio}>
            <View style={[styles.vazioIconeBox, { backgroundColor: tema.card, borderColor: tema.borda }]}>
              <Ionicons name="people-outline" size={36} color={tema.textoFraco} />
            </View>
            <Text style={[styles.vazioTitulo, { color: tema.textoSec }]}>
              {busca ? 'Nenhum resultado' : 'Nenhum cliente ainda'}
            </Text>
            <Text style={[styles.vazioTexto, { color: tema.textoFraco }]}>
              {busca ? 'Tente um termo diferente.' : 'Toque no + para cadastrar o primeiro cliente.'}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const cor = corAvatar(item.id);
          const mostrarSeparador = index === 0 || (
            clientesFiltrados[index - 1]?.nome[0].toUpperCase() !== item.nome[0].toUpperCase()
          );
          const letraSec = item.nome[0].toUpperCase();
          return (
            <>
              {mostrarSeparador && (
                <View style={styles.separadorRow}>
                  <Text style={[styles.separadorLetra, { color: tema.primario }]}>{letraSec}</Text>
                  <View style={[styles.separadorLinha, { backgroundColor: tema.borda }]} />
                </View>
              )}
              <TouchableOpacity
                style={[styles.card, { backgroundColor: tema.card, borderColor: tema.borda }]}
                onPress={() => onEditarCliente(item.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.avatar, { backgroundColor: cor + '22' }]}>
                  <Text style={[styles.avatarTexto, { color: cor }]}>{iniciais(item.nome)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardNome, { color: tema.texto }]}>{item.nome}</Text>
                  <Text style={[styles.cardDoc, { color: tema.textoSec }]}>{item.cnpjCpf}</Text>
                  <View style={styles.cardMetaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={11} color={tema.textoFraco} />
                      <Text style={[styles.metaTexto, { color: tema.textoFraco }]}>{item.cidade}/{item.estado}</Text>
                    </View>
                    {!!item.telefone && (
                      <View style={styles.metaItem}>
                        <Ionicons name="call-outline" size={11} color={tema.textoFraco} />
                        <Text style={[styles.metaTexto, { color: tema.textoFraco }]}>{item.telefone}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="create-outline" size={16} color={tema.textoFraco} />
              </TouchableOpacity>
            </>
          );
        }}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: '#16a34a', shadowColor: '#16a34a' }]}
        onPress={onNovoCliente}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

function criarEstilos(t: AppTema) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.fundo },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 20, paddingTop: 60, paddingBottom: 14,
    },
    iconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    titulo: { color: t.texto, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
    subtitulo: { fontSize: 12, marginTop: 1 },
    novoBtn: {
      width: 40, height: 40, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center', marginLeft: 'auto', flexShrink: 0,
      shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    buscaBox: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      marginHorizontal: 20, marginBottom: 14, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13,
    },
    buscaInput: { flex: 1, fontSize: 14, paddingVertical: 11 },
    lista: { paddingHorizontal: 20, paddingBottom: 100 },
    listaVazia: { flexGrow: 1 },
    vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 8, paddingTop: 60 },
    vazioIconeBox: {
      width: 72, height: 72, borderRadius: 20, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    },
    vazioTitulo: { fontSize: 16, fontWeight: '700' },
    vazioTexto: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
    separadorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 6 },
    separadorLetra: { fontSize: 12, fontWeight: '700', width: 14 },
    separadorLinha: { flex: 1, height: 1 },
    card: {
      flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14,
      borderWidth: 1, marginBottom: 8, gap: 12,
    },
    avatar: {
      width: 46, height: 46, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    avatarTexto: { fontSize: 16, fontWeight: '800' },
    cardInfo: { flex: 1 },
    cardNome: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2, marginBottom: 2 },
    cardDoc: { fontSize: 12, marginBottom: 5 },
    cardMetaRow: { flexDirection: 'row', gap: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metaTexto: { fontSize: 11 },
    tagChip: {
      width: 28, height: 28, borderRadius: 8, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    fab: {
      position: 'absolute', right: 20, bottom: 30,
      width: 56, height: 56, borderRadius: 28,
      alignItems: 'center', justifyContent: 'center',
      shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
  });
}
