import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar, salvar } from '../utils/storage';

export type Tecnico = {
  id: string;
  nome: string;
  telefone: string;
  cargo: string;
};

type Props = {
  onVoltar: () => void;
  onNovoTecnico: () => void;
};

export default function TecnicosListScreen({ onVoltar, onNovoTecnico }: Props) {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [recarregando, setRecarregando] = useState(false);

  const carregarTecnicos = useCallback(async () => {
    const lista = (await carregar<Tecnico[]>('tecnicos')) ?? [];
    setTecnicos(lista);
  }, []);

  useEffect(() => { carregarTecnicos(); }, [carregarTecnicos]);

  async function recarregar() {
    setRecarregando(true);
    await carregarTecnicos();
    setRecarregando(false);
  }

  function confirmarExclusao(tecnico: Tecnico) {
    Alert.alert(
      'Excluir Técnico',
      `Deseja remover ${tecnico.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            const lista = (await carregar<Tecnico[]>('tecnicos')) ?? [];
            await salvar('tecnicos', lista.filter((t) => t.id !== tecnico.id));
            await carregarTecnicos();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={styles.voltarBotao}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Técnicos</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={tecnicos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl
            refreshing={recarregando}
            onRefresh={recarregar}
            tintColor="#2563eb"
            colors={['#2563eb']}
          />
        }
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Ionicons name="people-outline" size={48} color="#334155" />
            <Text style={styles.vazioTitulo}>Nenhum técnico cadastrado</Text>
            <Text style={styles.vazioTexto}>
              Toque no botão abaixo para cadastrar o primeiro técnico.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIcone}>
              <Ionicons name="person" size={20} color="#9333ea" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardNome}>{item.nome}</Text>
              <Text style={styles.cardCargo}>{item.cargo}</Text>
              {!!item.telefone && (
                <View style={styles.telefoneRow}>
                  <Ionicons name="call-outline" size={12} color="#64748b" />
                  <Text style={styles.cardTelefone}>{item.telefone}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => confirmarExclusao(item)}
              style={styles.excluirBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={17} color="#f87171" />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={onNovoTecnico} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
  },
  voltarBotao: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#111827',
    borderWidth: 1, borderColor: '#1f2937', alignItems: 'center', justifyContent: 'center',
  },
  titulo: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  lista: { paddingHorizontal: 20, paddingBottom: 100 },
  vazio: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40 },
  vazioTitulo: { color: '#94a3b8', fontSize: 16, fontWeight: '600', marginTop: 14 },
  vazioTexto: { color: '#475569', fontSize: 13, textAlign: 'center', marginTop: 6 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111827', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: '#1f2937', marginBottom: 10,
  },
  cardIcone: {
    width: 42, height: 42, borderRadius: 11,
    backgroundColor: '#9333ea22', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardNome: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  cardCargo: { color: '#64748b', fontSize: 12, marginTop: 2 },
  telefoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  cardTelefone: { color: '#64748b', fontSize: 12 },
  excluirBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#f8717122',
    alignItems: 'center', justifyContent: 'center',
  },
  fab: {
    position: 'absolute', right: 20, bottom: 30,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#9333ea', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#9333ea', shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
});
