import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar, salvar } from '../utils/storage';
import type { OrdemServico } from './OSListScreen';

type Props = {
  osId: string;
  onVoltar: () => void;
  onAlterado: () => void;
};

const STATUS_OPCOES: OrdemServico['status'][] = ['Aberta', 'Em Andamento', 'Concluída'];

const CORES_STATUS: Record<string, string> = {
  Aberta: '#d97706',
  'Em Andamento': '#2563eb',
  Concluída: '#16a34a',
};

export default function OSDetailScreen({ osId, onVoltar, onAlterado }: Props) {
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);

  const carregarOrdem = useCallback(async () => {
    const lista = (await carregar<OrdemServico[]>('ordensServico')) ?? [];
    const encontrada = lista.find((o) => o.id === osId) ?? null;
    setOrdem(encontrada);
  }, [osId]);

  useEffect(() => {
    carregarOrdem();
  }, [carregarOrdem]);

  async function alterarStatus(novoStatus: OrdemServico['status']) {
    if (!ordem) return;
    const lista = (await carregar<OrdemServico[]>('ordensServico')) ?? [];
    const novaLista = lista.map((o) =>
      o.id === ordem.id ? { ...o, status: novoStatus } : o
    );
    await salvar('ordensServico', novaLista);
    setOrdem({ ...ordem, status: novoStatus });
    onAlterado();
  }

  function confirmarExclusao() {
    Alert.alert(
      'Excluir Ordem de Serviço',
      'Essa ação não pode ser desfeita. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: excluirOrdem },
      ]
    );
  }

  async function excluirOrdem() {
    if (!ordem) return;
    const lista = (await carregar<OrdemServico[]>('ordensServico')) ?? [];
    const novaLista = lista.filter((o) => o.id !== ordem.id);
    await salvar('ordensServico', novaLista);
    onAlterado();
    onVoltar();
  }

  if (!ordem) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onVoltar} style={styles.voltarBotao}>
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.titulo}>Ordem de Serviço</Text>
          <View style={{ width: 36 }} />
        </View>
        <Text style={styles.naoEncontrado}>Ordem não encontrada.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={styles.voltarBotao}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Detalhes da OS</Text>
        <TouchableOpacity onPress={confirmarExclusao} style={styles.excluirBotao}>
          <Ionicons name="trash-outline" size={20} color="#f87171" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardTopo}>
            <View style={styles.iconeCliente}>
              <Ionicons name="business" size={22} color="#2563eb" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cliente}>{ordem.cliente}</Text>
              <Text style={styles.data}>Criada em {ordem.dataCriacao}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>Informações técnicas</Text>

          <View style={styles.infoLinha}>
            <Ionicons name="cog-outline" size={16} color="#64748b" />
            <Text style={styles.infoLabel}>Motor / Equipamento</Text>
          </View>
          <Text style={styles.infoValor}>{ordem.motor}</Text>

          <View style={[styles.infoLinha, { marginTop: 14 }]}>
            <Ionicons name="locate-outline" size={16} color="#64748b" />
            <Text style={styles.infoLabel}>Posição</Text>
          </View>
          <Text style={styles.infoValor}>{ordem.posicao}</Text>

          <View style={[styles.infoLinha, { marginTop: 14 }]}>
            <Ionicons name="construct-outline" size={16} color="#64748b" />
            <Text style={styles.infoLabel}>Tipo de manutenção</Text>
          </View>
          <Text style={styles.infoValor}>{ordem.tipoManutencao}</Text>

          {!!ordem.descricao && (
            <>
              <View style={[styles.infoLinha, { marginTop: 14 }]}>
                <Ionicons name="document-text-outline" size={16} color="#64748b" />
                <Text style={styles.infoLabel}>Descrição</Text>
              </View>
              <Text style={styles.infoValor}>{ordem.descricao}</Text>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>Status</Text>
          <View style={styles.statusOpcoes}>
            {STATUS_OPCOES.map((opcao) => (
              <TouchableOpacity
                key={opcao}
                style={[
                  styles.statusChip,
                  ordem.status === opcao && {
                    backgroundColor: CORES_STATUS[opcao],
                    borderColor: CORES_STATUS[opcao],
                  },
                ]}
                onPress={() => alterarStatus(opcao)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.statusChipTexto,
                    ordem.status === opcao && styles.statusChipTextoAtivo,
                  ]}
                >
                  {opcao}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
  excluirBotao: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f8717122',
    borderWidth: 1,
    borderColor: '#f8717155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  naoEncontrado: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 14,
  },
  cardTopo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconeCliente: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#2563eb22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cliente: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  data: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  secaoTitulo: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  infoValor: {
    color: '#ffffff',
    fontSize: 15,
    marginTop: 4,
    marginLeft: 22,
  },
  statusOpcoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  statusChipTexto: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  statusChipTextoAtivo: {
    color: '#ffffff',
  },
});