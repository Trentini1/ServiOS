import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar } from '../utils/storage';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';

export type Cliente = {
  id: string; nome: string; cnpjCpf: string; telefone: string; cidade: string; estado: string;
};

type Props = { onVoltar: () => void; onNovoCliente: () => void };

export default function ClientListScreen({ onVoltar, onNovoCliente }: Props) {
  const tema = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={styles.voltarBotao}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Clientes</Text>
        <View style={{ width: 36 }} />
      </View>

      {clientes.length === 0 ? (
        <View style={styles.vazio}>
          <Ionicons name="people-outline" size={48} color={tema.borda} />
          <Text style={styles.vazioTitulo}>Nenhum cliente ainda</Text>
          <Text style={styles.vazioTexto}>Toque no botão abaixo para cadastrar o primeiro cliente.</Text>
        </View>
      ) : (
        <FlatList
          data={clientes.slice().reverse()}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl refreshing={recarregando} onRefresh={recarregar}
              tintColor="#16a34a" colors={['#16a34a']} />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardIcone}>
                <Ionicons name="business" size={20} color="#16a34a" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardNome}>{item.nome}</Text>
                <Text style={styles.cardDetalhe}>{item.cnpjCpf}</Text>
                <Text style={styles.cardLocal}>{item.cidade}/{item.estado} • {item.telefone}</Text>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={onNovoCliente} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
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
    titulo: { color: t.texto, fontSize: 18, fontWeight: '700' },
    vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    vazioTitulo: { color: t.textoSec, fontSize: 16, fontWeight: '600', marginTop: 14 },
    vazioTexto: { color: t.textoFraco, fontSize: 13, textAlign: 'center', marginTop: 6 },
    lista: { paddingHorizontal: 20, paddingBottom: 100 },
    card: {
      flexDirection: 'row', backgroundColor: t.card, borderRadius: 16,
      padding: 16, borderWidth: 1, borderColor: t.borda, marginBottom: 12, alignItems: 'center',
    },
    cardIcone: {
      width: 44, height: 44, borderRadius: 12, backgroundColor: '#16a34a22',
      alignItems: 'center', justifyContent: 'center', marginRight: 14,
    },
    cardInfo: { flex: 1 },
    cardNome: { color: t.texto, fontSize: 15, fontWeight: '600', marginBottom: 2 },
    cardDetalhe: { color: t.textoSec, fontSize: 13, marginBottom: 2 },
    cardLocal: { color: t.textoMuted, fontSize: 12 },
    fab: {
      position: 'absolute', right: 20, bottom: 30,
      width: 56, height: 56, borderRadius: 28, backgroundColor: '#16a34a',
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#16a34a', shadowOpacity: 0.4, shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
  });
}
