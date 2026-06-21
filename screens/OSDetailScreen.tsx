import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar, salvar } from '../utils/storage';
import type { OrdemServico, DiaExecucao, PecaUtilizada } from './OSListScreen';
import SignatureModal from '../components/SignatureModal';
import FotosOS from '../components/FotosOS';
import PeriodosExecucao from '../components/PeriodosExecucao';
import PecasUtilizadas from '../components/PecasUtilizadas';
import { gerarESalvarPdfOS } from '../utils/gerarPdfOS';
import { useThema, usePdfTema } from '../contexts/ThemeContext';
import { AppTema, PDF_TEMAS_PRESET } from '../utils/temas';

type Empresa = {
  nome: string; cnpj?: string; telefone?: string; email?: string;
  endereco?: string; cidade?: string; estado?: string; segmento?: string;
};

type Props = { osId: string; onVoltar: () => void; onAlterado: () => void };

const STATUS_OPCOES: OrdemServico['status'][] = ['Aberta', 'Em Andamento', 'Concluída'];
const CORES_STATUS: Record<string, string> = {
  Aberta: '#d97706', 'Em Andamento': '#2563eb', Concluída: '#16a34a',
};

export default function OSDetailScreen({ osId, onVoltar, onAlterado }: Props) {
  const tema = useThema();
  const pdfTemaPadrao = usePdfTema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);

  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [modalAssinatura, setModalAssinatura] = useState<'tecnico' | 'cliente' | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const carregarOrdem = useCallback(async () => {
    const lista = (await carregar<OrdemServico[]>('ordensServico')) ?? [];
    setOrdem(lista.find((o) => o.id === osId) ?? null);
  }, [osId]);

  useEffect(() => {
    carregarOrdem();
    carregar<Empresa>('empresa').then(setEmpresa);
  }, [carregarOrdem]);

  async function exportarPdf() {
    if (!ordem || !empresa) return;
    setGerandoPdf(true);
    try {
      const pdfTemaOS = ordem.temaPdfId
        ? PDF_TEMAS_PRESET.find((t) => t.id === ordem.temaPdfId) ?? pdfTemaPadrao
        : pdfTemaPadrao;
      await gerarESalvarPdfOS(ordem, empresa, pdfTemaOS);
    } catch {
      Alert.alert('Erro', 'Não foi possível gerar o PDF.');
    } finally {
      setGerandoPdf(false);
    }
  }

  async function salvarCampo<K extends keyof OrdemServico>(campo: K, valor: OrdemServico[K]) {
    if (!ordem) return;
    const lista = (await carregar<OrdemServico[]>('ordensServico')) ?? [];
    const novaLista = lista.map((o) => o.id === ordem.id ? { ...o, [campo]: valor } : o);
    await salvar('ordensServico', novaLista);
    setOrdem((prev) => prev ? { ...prev, [campo]: valor } : prev);
    onAlterado();
  }

  function confirmarExclusao() {
    Alert.alert('Excluir Ordem de Serviço', 'Essa ação não pode ser desfeita. Deseja continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: excluirOrdem },
    ]);
  }

  async function excluirOrdem() {
    if (!ordem) return;
    const lista = (await carregar<OrdemServico[]>('ordensServico')) ?? [];
    await salvar('ordensServico', lista.filter((o) => o.id !== ordem.id));
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
        <Text style={[styles.naoEncontrado, { color: tema.textoMuted }]}>Ordem não encontrada.</Text>
      </View>
    );
  }

  const pdfTemaAtivo = ordem.temaPdfId
    ? PDF_TEMAS_PRESET.find((t) => t.id === ordem.temaPdfId) ?? pdfTemaPadrao
    : pdfTemaPadrao;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={styles.voltarBotao}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Detalhes da OS</Text>
        <View style={styles.headerAcoes}>
          <TouchableOpacity onPress={exportarPdf}
            style={[styles.pdfBotao, { backgroundColor: tema.primario + '22', borderColor: tema.primario + '55' }, gerandoPdf && { opacity: 0.5 }]}
            disabled={gerandoPdf}>
            <Ionicons name="share-outline" size={18} color={tema.primario} />
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmarExclusao} style={styles.excluirBotao}>
            <Ionicons name="trash-outline" size={20} color="#f87171" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Cliente */}
        <View style={styles.card}>
          <View style={styles.cardTopo}>
            <View style={[styles.iconeCliente, { backgroundColor: tema.primario + '22' }]}>
              <Ionicons name="business" size={22} color={tema.primario} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cliente}>{ordem.cliente}</Text>
              <Text style={styles.data}>Criada em {ordem.dataCriacao}</Text>
              {!!ordem.clienteTelefone && (
                <View style={styles.telefoneRow}>
                  <Ionicons name="call-outline" size={13} color={tema.textoMuted} />
                  <Text style={styles.telefone}>{ordem.clienteTelefone}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Informações técnicas */}
        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>Informações técnicas</Text>
          {[
            { icone: 'cog-outline', label: 'Motor / Equipamento', valor: ordem.motor },
            { icone: 'locate-outline', label: 'Posição', valor: ordem.posicao },
            { icone: 'construct-outline', label: 'Tipo de manutenção', valor: ordem.tipoManutencao },
            ordem.descricao ? { icone: 'document-text-outline', label: 'Descrição', valor: ordem.descricao } : null,
            ordem.tecnicoResponsavel ? { icone: 'person-outline', label: 'Técnico responsável', valor: ordem.tecnicoResponsavel } : null,
            ordem.dataAgendada ? { icone: 'calendar-outline', label: 'Data agendada', valor: ordem.dataAgendada.split('-').reverse().join('/') } : null,
          ].filter(Boolean).map((item, idx) => (
            <View key={idx} style={idx > 0 ? { marginTop: 14 } : {}}>
              <View style={styles.infoLinha}>
                <Ionicons name={(item as any).icone as any} size={16} color={tema.textoMuted} />
                <Text style={styles.infoLabel}>{(item as any).label}</Text>
              </View>
              <Text style={styles.infoValor}>{(item as any).valor}</Text>
            </View>
          ))}
        </View>

        {/* Status */}
        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>Status</Text>
          <View style={styles.statusOpcoes}>
            {STATUS_OPCOES.map((opcao) => (
              <TouchableOpacity
                key={opcao}
                style={[styles.statusChip,
                  { borderColor: tema.borda },
                  ordem.status === opcao && { backgroundColor: CORES_STATUS[opcao], borderColor: CORES_STATUS[opcao] }]}
                onPress={() => salvarCampo('status', opcao)}
                activeOpacity={0.8}
              >
                <Text style={[styles.statusChipTexto,
                  ordem.status === opcao && styles.statusChipTextoAtivo]}>
                  {opcao}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Períodos */}
        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>Períodos de execução</Text>
          <PeriodosExecucao dias={ordem.diasExecucao ?? []} onChange={(dias) => salvarCampo('diasExecucao', dias)} />
        </View>

        {/* Peças */}
        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>Peças utilizadas</Text>
          <PecasUtilizadas pecas={ordem.pecas ?? []} onChange={(p) => salvarCampo('pecas', p)} />
        </View>

        {/* Tema do PDF desta OS */}
        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>Tema do PDF desta OS</Text>
          <View style={styles.pdfTemasRow}>
            {PDF_TEMAS_PRESET.map((pdfT) => {
              const ativo = pdfTemaAtivo.id === pdfT.id;
              return (
                <TouchableOpacity
                  key={pdfT.id}
                  style={[styles.pdfTemaChip,
                    { borderColor: ativo ? pdfT.corHeader : tema.borda },
                    ativo && { backgroundColor: pdfT.corHeader + '22' }]}
                  onPress={() => salvarCampo('temaPdfId', pdfT.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.pdfTemaColor, { backgroundColor: pdfT.corHeader }]} />
                  <Text style={[styles.pdfTemaTexto, ativo && { color: pdfT.corHeader }]}>
                    {pdfT.nome.split(' ')[0]}
                  </Text>
                  {ativo && <Ionicons name="checkmark" size={10} color={pdfT.corHeader} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Assinaturas */}
        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>Assinaturas</Text>
          {(['tecnico', 'cliente'] as const).map((tipo) => {
            const campo = tipo === 'tecnico' ? 'assinaturaTecnico' : 'assinaturaCliente';
            const assinatura = ordem[campo];
            return (
              <View key={tipo} style={[styles.assinaturaLinha, tipo === 'cliente' && { marginTop: 16 }]}>
                <Text style={styles.assinaturaLabel}>{tipo === 'tecnico' ? 'Técnico' : 'Cliente'}</Text>
                {assinatura ? (
                  <TouchableOpacity onPress={() => setModalAssinatura(tipo)}>
                    <Image source={{ uri: assinatura }} style={styles.assinaturaImagem} resizeMode="contain" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.assinaturaBotao, { backgroundColor: tema.primario + '22', borderColor: tema.primario + '55' }]}
                    onPress={() => setModalAssinatura(tipo)} activeOpacity={0.8}
                  >
                    <Ionicons name="create-outline" size={16} color={tema.primario} />
                    <Text style={[styles.assinaturaBotaoTexto, { color: tema.primario }]}>Assinar</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Fotos */}
        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>Fotos</Text>
          <FotosOS fotos={ordem.fotos ?? []} onChange={(f) => salvarCampo('fotos', f)} maxFotos={10} />
        </View>
      </ScrollView>

      <SignatureModal
        visivel={modalAssinatura !== null}
        titulo={modalAssinatura === 'tecnico' ? 'Assinatura do Técnico' : 'Assinatura do Cliente'}
        onFechar={() => setModalAssinatura(null)}
        onSalvar={(b64) => { if (modalAssinatura) salvarCampo(modalAssinatura === 'tecnico' ? 'assinaturaTecnico' : 'assinaturaCliente', b64); }}
      />
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
    headerAcoes: { flexDirection: 'row', gap: 8 },
    pdfBotao: {
      width: 36, height: 36, borderRadius: 10, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center',
    },
    excluirBotao: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: '#f8717122', borderWidth: 1, borderColor: '#f8717155',
      alignItems: 'center', justifyContent: 'center',
    },
    titulo: { color: t.texto, fontSize: 17, fontWeight: '700' },
    naoEncontrado: { textAlign: 'center', marginTop: 40 },
    scrollContent: { padding: 20, paddingTop: 4, paddingBottom: 40 },
    card: {
      backgroundColor: t.card, borderRadius: 16, padding: 18,
      borderWidth: 1, borderColor: t.borda, marginBottom: 14,
    },
    cardTopo: { flexDirection: 'row', alignItems: 'center' },
    iconeCliente: {
      width: 46, height: 46, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center', marginRight: 14,
    },
    cliente: { color: t.texto, fontSize: 17, fontWeight: '700' },
    data: { color: t.textoMuted, fontSize: 12, marginTop: 2 },
    telefoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    telefone: { color: t.textoMuted, fontSize: 12 },
    secaoTitulo: {
      color: t.textoSec, fontSize: 13, fontWeight: '600',
      marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    infoLinha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoLabel: { color: t.textoMuted, fontSize: 12 },
    infoValor: { color: t.texto, fontSize: 15, marginTop: 4, marginLeft: 22 },
    statusOpcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statusChip: {
      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
      backgroundColor: t.fundo, borderWidth: 1,
    },
    statusChipTexto: { color: t.textoMuted, fontSize: 13, fontWeight: '600' },
    statusChipTextoAtivo: { color: '#ffffff' },
    pdfTemasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pdfTemaChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
    },
    pdfTemaColor: { width: 10, height: 10, borderRadius: 5 },
    pdfTemaTexto: { color: t.textoSec, fontSize: 11, fontWeight: '600' },
    assinaturaLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    assinaturaLabel: { color: t.textoSec, fontSize: 13, fontWeight: '500' },
    assinaturaImagem: { width: 140, height: 60, backgroundColor: '#ffffff', borderRadius: 8 },
    assinaturaBotao: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    },
    assinaturaBotaoTexto: { fontSize: 13, fontWeight: '600' },
  });
}
