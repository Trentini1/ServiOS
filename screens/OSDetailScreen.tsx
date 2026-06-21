import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar, salvar } from '../utils/cloudStorage';
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

type Props = { osId: string; onVoltar: () => void; onAlterado: () => void; onEditarOS?: () => void };

const STATUS_OPCOES: OrdemServico['status'][] = ['Aberta', 'Em Andamento', 'Concluída'];
const CORES_STATUS: Record<string, string> = {
  Aberta: '#d97706', 'Em Andamento': '#2563eb', Concluída: '#16a34a',
};
const ICONES_STATUS: Record<string, string> = {
  Aberta: 'radio-button-on-outline', 'Em Andamento': 'sync-outline', Concluída: 'checkmark-circle-outline',
};

export default function OSDetailScreen({ osId, onVoltar, onAlterado, onEditarOS }: Props) {
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

  async function salvarCampo<K extends keyof OrdemServico>(campo: K, valor: OrdemServico[K]) {
    if (!ordem) return;
    const lista = (await carregar<OrdemServico[]>('ordensServico')) ?? [];
    const nova  = lista.map((o) => o.id === ordem.id ? { ...o, [campo]: valor } : o);
    await salvar('ordensServico', nova);
    setOrdem((prev) => prev ? { ...prev, [campo]: valor } : prev);
    onAlterado();
  }

  async function exportarPdf() {
    if (!ordem || !empresa) return;
    setGerandoPdf(true);
    try {
      const pdfTema = ordem.temaPdfId
        ? (PDF_TEMAS_PRESET.find((t) => t.id === ordem.temaPdfId) ?? pdfTemaPadrao)
        : pdfTemaPadrao;
      const logo = await carregar<string>('logoEmpresa');
      await gerarESalvarPdfOS(ordem, empresa, pdfTema, logo ?? undefined);
    } catch {
      Alert.alert('Erro', 'Não foi possível gerar o PDF.');
    } finally {
      setGerandoPdf(false);
    }
  }

  function confirmarExclusao() {
    Alert.alert('Excluir OS', 'Essa ação não pode ser desfeita.', [
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
          <TouchableOpacity onPress={onVoltar} style={[styles.iconBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}>
            <Ionicons name="arrow-back" size={20} color={tema.texto} />
          </TouchableOpacity>
          <Text style={styles.headerTitulo}>Detalhes da OS</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.semDados}>
          <Ionicons name="document-text-outline" size={48} color={tema.textoFraco} />
          <Text style={[styles.semDadosTexto, { color: tema.textoMuted }]}>Ordem não encontrada.</Text>
        </View>
      </View>
    );
  }

  const corStatus = CORES_STATUS[ordem.status] ?? '#64748b';
  const pdfTemaAtivo = ordem.temaPdfId
    ? (PDF_TEMAS_PRESET.find((t) => t.id === ordem.temaPdfId) ?? pdfTemaPadrao)
    : pdfTemaPadrao;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={[styles.iconBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Ionicons name="arrow-back" size={20} color={tema.texto} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Detalhes da OS</Text>
        <View style={styles.headerAcoes}>
          {onEditarOS && (
            <TouchableOpacity
              onPress={onEditarOS}
              style={[styles.iconBtn, { backgroundColor: tema.primario + '22', borderColor: tema.primario + '44' }]}
            >
              <Ionicons name="create-outline" size={18} color={tema.primario} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={exportarPdf}
            style={[styles.iconBtn, { backgroundColor: tema.primario + '22', borderColor: tema.primario + '44' }, gerandoPdf && { opacity: 0.5 }]}
            disabled={gerandoPdf}
          >
            <Ionicons name={gerandoPdf ? 'hourglass-outline' : 'share-outline'} size={18} color={tema.primario} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={confirmarExclusao}
            style={[styles.iconBtn, { backgroundColor: '#f8717115', borderColor: '#f8717133' }]}
          >
            <Ionicons name="trash-outline" size={18} color="#f87171" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Banner do cliente */}
        <View style={[styles.clienteBanner, { backgroundColor: tema.card, borderColor: corStatus + '44' }]}>
          <View style={[styles.clienteAvatar, { backgroundColor: corStatus + '22' }]}>
            <Ionicons name="business" size={24} color={corStatus} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.clienteNome, { color: tema.texto }]}>{ordem.cliente}</Text>
            {!!ordem.clienteTelefone && (
              <View style={styles.clienteTelRow}>
                <Ionicons name="call-outline" size={12} color={tema.textoMuted} />
                <Text style={[styles.clienteTel, { color: tema.textoMuted }]}>{ordem.clienteTelefone}</Text>
              </View>
            )}
            <Text style={[styles.clienteData, { color: tema.textoFraco }]}>Criada em {ordem.dataCriacao}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: corStatus + '22', borderColor: corStatus + '66' }]}>
            <Ionicons name={ICONES_STATUS[ordem.status] as any} size={13} color={corStatus} />
            <Text style={[styles.statusPillTexto, { color: corStatus }]}>{ordem.status}</Text>
          </View>
        </View>

        {/* Informações técnicas */}
        <SecaoCard titulo="Informações Técnicas" icone="construct-outline" tema={tema}>
          {/* Prioridade badge */}
          {!!ordem.prioridade && (
            <View style={styles.prioridadeRow}>
              {[
                { v: 'Baixa', c: '#16a34a' }, { v: 'Normal', c: tema.primario },
                { v: 'Alta', c: '#d97706' }, { v: 'Urgente', c: '#dc2626' },
              ].map(({ v, c }) => {
                const ativa = ordem.prioridade === v;
                return (
                  <View key={v} style={[styles.prioBadge, { borderColor: ativa ? c : tema.borda, backgroundColor: ativa ? c + '22' : 'transparent' }]}>
                    <Text style={[styles.prioTexto, { color: ativa ? c : tema.textoFraco, fontWeight: ativa ? '700' : '400' }]}>{v}</Text>
                  </View>
                );
              })}
            </View>
          )}
          <View style={styles.infoGrid}>
            {[
              { label: 'Motor / Equipamento', valor: ordem.motor,          icone: 'cog-outline'         },
              { label: 'Posição',              valor: ordem.posicao,        icone: 'locate-outline'      },
              { label: 'Tipo de Manutenção',   valor: ordem.tipoManutencao, icone: 'build-outline'       },
              ordem.tecnicoResponsavel ? { label: 'Técnico Responsável', valor: ordem.tecnicoResponsavel, icone: 'person-outline' } : null,
              ordem.dataAgendada       ? { label: 'Data Agendada',       valor: ordem.dataAgendada.split('-').reverse().join('/'), icone: 'calendar-outline' } : null,
              ordem.numeroOS  ? { label: 'Número OS',           valor: ordem.numeroOS,  icone: 'bookmark-outline' } : null,
              ordem.tipoVeiculo ? { label: 'Tipo de Veículo',   valor: ordem.tipoVeiculo, icone: 'car-outline' } : null,
              ordem.modelo    ? { label: 'Modelo',              valor: ordem.modelo,    icone: 'cube-outline'    } : null,
              ordem.ano       ? { label: 'Ano',                 valor: ordem.ano,       icone: 'calendar-number-outline' } : null,
              ordem.placa     ? { label: 'Placa',               valor: ordem.placa,     icone: 'barcode-outline' } : null,
              ordem.horimetro ? { label: 'Horímetro',           valor: ordem.horimetro, icone: 'timer-outline'   } : null,
              ordem.tempoEstimado ? { label: 'Tempo Estimado',  valor: ordem.tempoEstimado, icone: 'time-outline' } : null,
              ordem.valorEstimado ? { label: 'Valor Estimado',  valor: ordem.valorEstimado, icone: 'cash-outline' } : null,
              ordem.formaPagamento ? { label: 'Pagamento',      valor: ordem.formaPagamento, icone: 'card-outline' } : null,
              ordem.solicitante ? { label: 'Solicitante',       valor: ordem.solicitante, icone: 'person-add-outline' } : null,
              ordem.contatoSolicitante ? { label: 'Contato',    valor: ordem.contatoSolicitante, icone: 'call-outline' } : null,
              ordem.enderecoServico ? { label: 'Local do Serviço', valor: ordem.enderecoServico, icone: 'map-outline' } : null,
              ordem.seguro    ? { label: 'Seguro',              valor: ordem.seguro,    icone: 'shield-outline'  } : null,
            ].filter(Boolean).map((item: any, i) => (
              <View key={i} style={[styles.infoItem, i % 2 === 1 && { borderLeftWidth: 1, borderLeftColor: tema.borda }]}>
                <View style={styles.infoItemHeader}>
                  <Ionicons name={item.icone} size={12} color={tema.textoMuted} />
                  <Text style={[styles.infoLabel, { color: tema.textoMuted }]}>{item.label}</Text>
                </View>
                <Text style={[styles.infoValor, { color: tema.texto }]}>{item.valor}</Text>
              </View>
            ))}
          </View>
          {!!ordem.garantia && (
            <View style={[styles.garantiaBadge, { backgroundColor: '#16a34a18', borderColor: '#16a34a44' }]}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#16a34a" />
              <Text style={[styles.garantiaTexto, { color: '#16a34a' }]}>Em Garantia</Text>
            </View>
          )}
          {!!ordem.descricao && (
            <View style={[styles.descricaoBox, { backgroundColor: tema.fundo, borderColor: tema.borda }]}>
              <Text style={[styles.descricaoLabel, { color: tema.textoMuted }]}>Descrição do Serviço</Text>
              <Text style={[styles.descricaoTexto, { color: tema.textoSec }]}>{ordem.descricao}</Text>
            </View>
          )}
          {!!ordem.observacoesInternas && (
            <View style={[styles.descricaoBox, { backgroundColor: '#d9770610', borderColor: '#d9770633', marginTop: 8 }]}>
              <Text style={[styles.descricaoLabel, { color: '#d97706' }]}>Observações Internas</Text>
              <Text style={[styles.descricaoTexto, { color: tema.textoSec }]}>{ordem.observacoesInternas}</Text>
            </View>
          )}
        </SecaoCard>

        {/* Status */}
        <SecaoCard titulo="Alterar Status" icone="swap-horizontal-outline" tema={tema}>
          <View style={styles.statusOpcoes}>
            {STATUS_OPCOES.map((op) => {
              const ativo = ordem.status === op;
              const c     = CORES_STATUS[op];
              return (
                <TouchableOpacity
                  key={op}
                  style={[
                    styles.statusChip,
                    { borderColor: ativo ? c : tema.borda, backgroundColor: ativo ? c + '22' : tema.fundo },
                  ]}
                  onPress={() => salvarCampo('status', op)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={ICONES_STATUS[op] as any} size={14} color={ativo ? c : tema.textoMuted} />
                  <Text style={[styles.statusChipTexto, { color: ativo ? c : tema.textoMuted, fontWeight: ativo ? '700' : '500' }]}>
                    {op}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SecaoCard>

        {/* Períodos */}
        <SecaoCard titulo="Períodos de Execução" icone="time-outline" tema={tema}>
          <PeriodosExecucao
            dias={ordem.diasExecucao ?? []}
            onChange={(dias) => salvarCampo('diasExecucao', dias)}
          />
        </SecaoCard>

        {/* Peças */}
        <SecaoCard titulo="Peças Utilizadas" icone="hardware-chip-outline" tema={tema}>
          <PecasUtilizadas
            pecas={ordem.pecas ?? []}
            onChange={(p) => salvarCampo('pecas', p)}
          />
        </SecaoCard>

        {/* Tema do PDF */}
        <SecaoCard titulo="Tema do PDF desta OS" icone="document-text-outline" tema={tema}>
          <View style={styles.pdfTemasRow}>
            {PDF_TEMAS_PRESET.map((pdfT) => {
              const ativo = pdfTemaAtivo.id === pdfT.id;
              return (
                <TouchableOpacity
                  key={pdfT.id}
                  style={[
                    styles.pdfTemaChip,
                    { borderColor: ativo ? pdfT.corHeader : tema.borda, backgroundColor: ativo ? pdfT.corHeader + '1a' : tema.fundo },
                  ]}
                  onPress={() => salvarCampo('temaPdfId', pdfT.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.pdfTemaColor, { backgroundColor: pdfT.corHeader }]} />
                  <Text style={[styles.pdfTemaTexto, { color: ativo ? pdfT.corHeader : tema.textoSec }]}>
                    {pdfT.nome.split(' ')[0]}
                  </Text>
                  {ativo && <Ionicons name="checkmark" size={10} color={pdfT.corHeader} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </SecaoCard>

        {/* Assinaturas */}
        <SecaoCard titulo="Assinaturas" icone="create-outline" tema={tema}>
          {(['tecnico', 'cliente'] as const).map((tipo, i) => {
            const campo     = tipo === 'tecnico' ? 'assinaturaTecnico' : 'assinaturaCliente';
            const assinatura = ordem[campo];
            const label     = tipo === 'tecnico' ? 'Técnico' : 'Cliente';
            return (
              <View key={tipo} style={[styles.assinaturaRow, i > 0 && { borderTopWidth: 1, borderTopColor: tema.borda, marginTop: 14, paddingTop: 14 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.assinaturaLabel, { color: tema.textoSec }]}>{label}</Text>
                  {assinatura ? (
                    <TouchableOpacity onPress={() => setModalAssinatura(tipo)} activeOpacity={0.8}>
                      <Image source={{ uri: assinatura }} style={[styles.assinaturaImg, { borderColor: tema.borda }]} resizeMode="contain" />
                      <Text style={[styles.assinaturaTrocar, { color: tema.primario }]}>Tocar para refazer</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.assinarBtn, { backgroundColor: tema.primario + '1a', borderColor: tema.primario + '44' }]}
                      onPress={() => setModalAssinatura(tipo)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="create-outline" size={15} color={tema.primario} />
                      <Text style={[styles.assinarBtnTexto, { color: tema.primario }]}>Assinar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </SecaoCard>

        {/* Fotos */}
        <SecaoCard titulo="Fotos" icone="camera-outline" tema={tema}>
          <FotosOS fotos={ordem.fotos ?? []} onChange={(f) => salvarCampo('fotos', f)} maxFotos={10} />
        </SecaoCard>

      </ScrollView>

      <SignatureModal
        visivel={modalAssinatura !== null}
        titulo={modalAssinatura === 'tecnico' ? 'Assinatura do Técnico' : 'Assinatura do Cliente'}
        onFechar={() => setModalAssinatura(null)}
        onSalvar={(b64) => {
          if (modalAssinatura) {
            salvarCampo(modalAssinatura === 'tecnico' ? 'assinaturaTecnico' : 'assinaturaCliente', b64);
          }
        }}
      />
    </View>
  );
}

function SecaoCard({
  titulo, icone, tema, children,
}: {
  titulo: string; icone: string; tema: AppTema; children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={secaoStyles.headerRow}>
        <View style={[secaoStyles.iconeBox, { backgroundColor: tema.primario + '18' }]}>
          <Ionicons name={icone as any} size={14} color={tema.primario} />
        </View>
        <Text style={[secaoStyles.titulo, { color: tema.textoSec }]}>{titulo}</Text>
      </View>
      <View style={[secaoStyles.corpo, { backgroundColor: tema.card, borderColor: tema.borda }]}>
        {children}
      </View>
    </View>
  );
}

const secaoStyles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8, paddingHorizontal: 2 },
  iconeBox: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  corpo: { borderRadius: 16, padding: 16, borderWidth: 1 },
});

function criarEstilos(t: AppTema) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.fundo },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    },
    headerTitulo: { color: t.texto, fontSize: 17, fontWeight: '700' },
    headerAcoes: { flexDirection: 'row', gap: 8 },
    iconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 48 },
    semDados: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
    semDadosTexto: { fontSize: 15 },

    clienteBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 20,
    },
    clienteAvatar: { width: 50, height: 50, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    clienteNome: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
    clienteTelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
    clienteTel: { fontSize: 12 },
    clienteData: { fontSize: 11, marginTop: 2 },
    statusPill: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
      alignSelf: 'flex-start', flexShrink: 0,
    },
    statusPillTexto: { fontSize: 11, fontWeight: '700' },

    prioridadeRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
    prioBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    prioTexto: { fontSize: 11 },
    garantiaBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, marginTop: 10, alignSelf: 'flex-start',
    },
    garantiaTexto: { fontSize: 12, fontWeight: '600' },
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    infoItem: { width: '50%', paddingVertical: 10, paddingHorizontal: 2 },
    infoItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    infoLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
    infoValor: { fontSize: 14, fontWeight: '600', marginTop: 3 },
    descricaoBox: { borderRadius: 10, padding: 12, borderWidth: 1, marginTop: 12 },
    descricaoLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 5 },
    descricaoTexto: { fontSize: 13, lineHeight: 20 },

    statusOpcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statusChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1,
    },
    statusChipTexto: { fontSize: 13 },

    pdfTemasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pdfTemaChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
    },
    pdfTemaColor: { width: 10, height: 10, borderRadius: 5 },
    pdfTemaTexto: { fontSize: 11, fontWeight: '600' },

    assinaturaRow: { flexDirection: 'row', alignItems: 'flex-start' },
    assinaturaLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 },
    assinaturaImg: { width: '100%', height: 80, backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1 },
    assinaturaTrocar: { fontSize: 11, textAlign: 'center', marginTop: 5 },
    assinarBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center',
      borderWidth: 1, paddingVertical: 12, borderRadius: 10, borderStyle: 'dashed',
    },
    assinarBtnTexto: { fontSize: 13, fontWeight: '600' },
  });
}
