import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar } from '../utils/cloudStorage';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';

export type Tecnico = { id: string; nome: string; telefone: string; cargo: string };

type Props = {
  onVoltar: () => void;
  onNovoTecnico: () => void;
  onEditarTecnico: (id: string) => void;
};

const CORES_CARGO: Record<string, string> = {
  'Técnico Junior':  '#0891b2', 'Técnico Pleno': '#2563eb', 'Técnico Senior': '#9333ea',
  'Eletricista':     '#d97706', 'Mecânico':       '#16a34a', 'Supervisor':     '#db2777',
  'Técnico':         '#9333ea', 'Encarregado':    '#0891b2',
};

function corDoCargo(cargo: string): string {
  const match = Object.keys(CORES_CARGO).find((k) => cargo.toLowerCase().includes(k.toLowerCase()));
  if (match) return CORES_CARGO[match];
  const soma = [...cargo].reduce((a, c) => a + c.charCodeAt(0), 0);
  const todas = Object.values(CORES_CARGO);
  return todas[soma % todas.length];
}

function iniciais(nome: string): string {
  return nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

export default function TecnicosListScreen({ onVoltar, onNovoTecnico, onEditarTecnico }: Props) {
  const tema   = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);
  const [tecnicos, setTecnicos]   = useState<Tecnico[]>([]);
  const [busca, setBusca]         = useState('');
  const [recarregando, setRecarregando] = useState(false);

  const carregarTecnicos = useCallback(async () => {
    setTecnicos((await carregar<Tecnico[]>('tecnicos')) ?? []);
  }, []);

  useEffect(() => { carregarTecnicos(); }, [carregarTecnicos]);

  async function recarregar() {
    setRecarregando(true);
    await carregarTecnicos();
    setRecarregando(false);
  }

  const tecnicosFiltrados = useMemo(() => {
    if (!busca.trim()) return tecnicos;
    const q = busca.toLowerCase();
    return tecnicos.filter((t) =>
      t.nome.toLowerCase().includes(q) || t.cargo.toLowerCase().includes(q)
    );
  }, [tecnicos, busca]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={[styles.iconBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Ionicons name="arrow-back" size={20} color={tema.texto} />
        </TouchableOpacity>
        <View>
          <Text style={styles.titulo}>Técnicos</Text>
          <Text style={[styles.subtitulo, { color: tema.textoMuted }]}>{tecnicos.length} na equipe</Text>
        </View>
        <TouchableOpacity
          onPress={onNovoTecnico}
          style={[styles.iconBtn, { backgroundColor: '#9333ea', borderColor: '#9333ea' }]}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {tecnicos.length > 0 && (
        <View style={[styles.buscaBox, { backgroundColor: tema.inputFundo, borderColor: tema.borda }]}>
          <Ionicons name="search-outline" size={17} color={tema.textoMuted} />
          <TextInput
            style={[styles.buscaInput, { color: tema.texto }]}
            placeholder="Buscar por nome ou cargo..."
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

      <FlatList
        data={tecnicosFiltrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.lista, tecnicosFiltrados.length === 0 && styles.listaVazia]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={recarregando} onRefresh={recarregar}
            tintColor="#9333ea" colors={['#9333ea']} />
        }
        ListEmptyComponent={
          <View style={styles.vazio}>
            <View style={[styles.vazioIcone, { backgroundColor: tema.card, borderColor: tema.borda }]}>
              <Ionicons name="construct-outline" size={36} color={tema.textoFraco} />
            </View>
            <Text style={[styles.vazioTitulo, { color: tema.textoSec }]}>
              {busca ? 'Nenhum resultado' : 'Nenhum técnico cadastrado'}
            </Text>
            <Text style={[styles.vazioTexto, { color: tema.textoFraco }]}>
              {busca ? 'Tente um termo diferente.' : 'Toque no + para cadastrar o primeiro membro da equipe.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const cor = corDoCargo(item.cargo);
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: tema.card, borderColor: tema.borda }]}
              onPress={() => onEditarTecnico(item.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.avatar, { backgroundColor: cor + '22' }]}>
                <Text style={[styles.avatarTexto, { color: cor }]}>{iniciais(item.nome)}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardNome, { color: tema.texto }]}>{item.nome}</Text>
                <View style={[styles.cargoBadge, { backgroundColor: cor + '18', borderColor: cor + '40' }]}>
                  <Text style={[styles.cargoTexto, { color: cor }]}>{item.cargo}</Text>
                </View>
                {!!item.telefone && (
                  <View style={styles.telRow}>
                    <Ionicons name="call-outline" size={11} color={tema.textoFraco} />
                    <Text style={[styles.telTexto, { color: tema.textoFraco }]}>{item.telefone}</Text>
                  </View>
                )}
              </View>
              <View style={styles.editarHint}>
                <Ionicons name="create-outline" size={15} color={tema.textoFraco} />
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: '#9333ea', shadowColor: '#9333ea' }]}
        onPress={onNovoTecnico}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function criarEstilos(t: AppTema) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.fundo },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    },
    iconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    titulo: { color: t.texto, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
    subtitulo: { fontSize: 12, marginTop: 1 },
    buscaBox: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      marginHorizontal: 20, marginBottom: 14, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13,
    },
    buscaInput: { flex: 1, fontSize: 14, paddingVertical: 11 },
    lista: { paddingHorizontal: 20, paddingBottom: 100 },
    listaVazia: { flexGrow: 1 },
    vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 8, paddingTop: 60 },
    vazioIcone: { width: 72, height: 72, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    vazioTitulo: { fontSize: 16, fontWeight: '700' },
    vazioTexto: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
    card: {
      flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14,
      borderWidth: 1, marginBottom: 10, gap: 12,
    },
    avatar: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    avatarTexto: { fontSize: 16, fontWeight: '800' },
    cardInfo: { flex: 1 },
    cardNome: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2, marginBottom: 5 },
    cargoBadge: {
      alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: 6, borderWidth: 1, marginBottom: 5,
    },
    cargoTexto: { fontSize: 11, fontWeight: '600' },
    telRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    telTexto: { fontSize: 11 },
    editarHint: { paddingHorizontal: 4 },
    fab: {
      position: 'absolute', right: 20, bottom: 30,
      width: 56, height: 56, borderRadius: 28,
      alignItems: 'center', justifyContent: 'center',
      shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
  });
}
