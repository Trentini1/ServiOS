import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar } from '../utils/storage';

export type OrdemServico = {
  id: string;
  cliente: string;
  motor: string;
  posicao: string;
  tipoManutencao: string;
  descricao: string;
  status: 'Aberta' | 'Em Andamento' | 'Concluída';
  dataCriacao: string;
};

type Props = {
  onVoltar: () => void;
  onNovaOS: () => void;
  onAbrirOS: (id: string) => void;
};

const CORES_STATUS: Record<string, string> = {
  Aberta: '#d97706',
  'Em Andamento': '#2563eb',
  Concluída: '#16a34a',
};

export default function OSListScreen({ onVoltar, onNovaOS, onAbrirOS }: Props) {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);

  const carregarOrdens = useCallback(async () => {
    const lista = await carregar<OrdemServico[]>('ordensServico');
    setOrdens(lista ?? []);
  }, []);

  useEffect(() => {
    carregarOrdens();
  }, [carregarOrdens]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={styles.voltarBotao}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Ordens de Serviço</Text>
        <View style={{ width: 36 }} />
      </View>

      {ordens.length === 0 ? (
        <View style={styles.vazio}>
          <Ionicons name="document-text-outline" size={48} color="#334155" />
          <Text style={styles.vazioTitulo}>Nenhuma OS ainda</Text>
          <Text style={styles.vazioTexto}>
            Toque no botão abaixo para criar a primeira ordem de serviço.
          </Text>
        </View>
      ) : (
        <FlatList
          data={ordens.slice().reverse()}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => onAbrirOS(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTopo}>
                <Text style={styles.cardCliente}>{item.cliente}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: CORES_STATUS[item.status] + '22' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTexto,
                      { color: CORES_STATUS[item.status] },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardDetalhe}>
                {item.motor} • Posição {item.posicao}
              </Text>
              <Text style={styles.cardTipo}>{item.tipoManutencao}</Text>
              <Text style={styles.cardData}>{item.dataCriacao}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={onNovaOS} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
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
    fontSize: 18,
    fontWeight: '700',
  },
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  vazioTitulo: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 14,
  },
  vazioTexto: {
    color: '#475569',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  lista: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 12,
  },
  cardTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardCliente: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDetalhe: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 2,
  },
  cardTipo: {
    color: '#64748b',
    fontSize: 12,
  },
  cardData: {
    color: '#374151',
    fontSize: 11,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});