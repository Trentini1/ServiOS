import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  RefreshControl, Image, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar } from '../utils/storage';
import type { OrdemServico } from './OSListScreen';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';

type Props = { onVoltar: () => void; onAbrirOS: (id: string) => void };

type FiltroAssinatura = 'todas' | 'completa' | 'parcial' | 'pendente';

const CORES_STATUS: Record<string, string> = {
  Aberta: '#d97706', 'Em Andamento': '#2563eb', Concluída: '#16a34a',
};

export default function AssinaturasScreen({ onVoltar, onAbrirOS }: Props) {
  const tema   = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);
  const [ordens, setOrdens]   = useState<OrdemServico[]>([]);
  const [filtro, setFiltro]   = useState<FiltroAssinatura>('todas');
  const [recarregando, setRecarregando] = useState(false);
  const [previewOS, setPreviewOS]   = useState<OrdemServico | null>(null);
  const [previewTipo, setPreviewTipo] = useState<'tecnico' | 'cliente' | null>(null);

  const carregar_ = useCallback(async () => {
    const lista = (await carregar<OrdemServico[]>('ordensServico')) ?? [];
    setOrdens(lista);
  }, []);

  useEffect(() => { carregar_(); }, [carregar_]);

  async function recarregar() {
    setRecarregando(true);
    await carregar_();
    setRecarregando(false);
  }

  const ordensFiltradas = useMemo(() => {
    const lista = [...ordens].reverse();
    if (filtro === 'completa')  return lista.filter((o) => !!o.assinaturaTecnico && !!o.assinaturaCliente);
    if (filtro === 'parcial')   return lista.filter((o) => (!!o.assinaturaTecnico) !== (!!o.assinaturaCliente));
    if (filtro === 'pendente')  return lista.filter((o) => !o.assinaturaTecnico && !o.assinaturaCliente);
    return lista;
  }, [ordens, filtro]);

  const totais = useMemo(() => ({
    todas:    ordens.length,
    completa: ordens.filter((o) => !!o.assinaturaTecnico && !!o.assinaturaCliente).length,
    parcial:  ordens.filter((o) => (!!o.assinaturaTecnico) !== (!!o.assinaturaCliente)).length,
    pendente: ordens.filter((o) => !o.assinaturaTecnico && !o.assinaturaCliente).length,
  }), [ordens]);

  const FILTROS: { id: FiltroAssinatura; label: string; cor: string }[] = [
    { id: 'todas',    label: 'Todas',           cor: tema.primario },
    { id: 'completa', label: 'Assinadas',        cor: '#16a34a' },
    { id: 'parcial',  label: 'Parcial',          cor: '#d97706' },
    { id: 'pendente', label: 'Sem assinatura',   cor: '#f87171' },
  ];

  function statusAssinatura(os: OrdemServico): { label: string; cor: string; icone: string } {
    const t = !!os.assinaturaTecnico, c = !!os.assinaturaCliente;
    if (t && c) return { label: 'Assinado', cor: '#16a34a', icone: 'checkmark-circle' };
    if (t || c) return { label: t ? 'Técnico assinou' : 'Cliente assinou', cor: '#d97706', icone: 'time' };
    return { label: 'Pendente', cor: '#f87171', icone: 'alert-circle-outline' };
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={[styles.iconBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Ionicons name="arrow-back" size={20} color={tema.texto} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>Assinaturas</Text>
          <Text style={[styles.subtitulo, { color: tema.textoMuted }]}>
            {totais.completa} de {totais.todas} OS assinadas
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#16a34a18', borderColor: '#16a34a33' }]}>
          <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
          <Text style={[styles.statNum, { color: '#16a34a' }]}>{totais.completa}</Text>
          <Text style={[styles.statLabel, { color: tema.textoMuted }]}>Completas</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#d9770618', borderColor: '#d9770633' }]}>
          <Ionicons name="time" size={20} color="#d97706" />
          <Text style={[styles.statNum, { color: '#d97706' }]}>{totais.parcial}</Text>
          <Text style={[styles.statLabel, { color: tema.textoMuted }]}>Parciais</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f8717118', borderColor: '#f8717133' }]}>
          <Ionicons name="alert-circle-outline" size={20} color="#f87171" />
          <Text style={[styles.statNum, { color: '#f87171' }]}>{totais.pendente}</Text>
          <Text style={[styles.statLabel, { color: tema.textoMuted }]}>Pendentes</Text>
        </View>
      </View>

      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtrosScroll}>
        {FILTROS.map((f) => {
          const ativo = filtro === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.filtroChip, { backgroundColor: ativo ? f.cor + '22' : tema.card, borderColor: ativo ? f.cor + '66' : tema.borda }]}
              onPress={() => setFiltro(f.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filtroTexto, { color: ativo ? f.cor : tema.textoMuted }]}>{f.label}</Text>
              <View style={[styles.filtroCount, { backgroundColor: ativo ? f.cor : tema.borda }]}>
                <Text style={[styles.filtroCountTexto, { color: ativo ? '#fff' : tema.textoFraco }]}>{totais[f.id]}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Lista */}
      <FlatList
        data={ordensFiltradas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.lista, ordensFiltradas.length === 0 && styles.listaVazia]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={recarregando} onRefresh={recarregar} tintColor={tema.primario} colors={[tema.primario]} />}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <View style={[styles.vazioIcone, { backgroundColor: tema.card, borderColor: tema.borda }]}>
              <Ionicons name="create-outline" size={32} color={tema.textoFraco} />
            </View>
            <Text style={[styles.vazioTitulo, { color: tema.textoSec }]}>Nenhuma OS neste filtro</Text>
          </View>
        }
        renderItem={({ item }) => {
          const ass    = statusAssinatura(item);
          const corOS  = CORES_STATUS[item.status] ?? '#64748b';
          const temTec = !!item.assinaturaTecnico;
          const temCli = !!item.assinaturaCliente;
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: tema.card, borderColor: tema.borda }]}
              onPress={() => onAbrirOS(item.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.cardBarra, { backgroundColor: corOS }]} />
              <View style={styles.cardCorpo}>
                {/* Linha 1 */}
                <View style={styles.cardTop}>
                  <Text style={[styles.cardCliente, { color: tema.texto }]} numberOfLines={1}>{item.cliente}</Text>
                  <View style={[styles.assBadge, { backgroundColor: ass.cor + '20', borderColor: ass.cor + '55' }]}>
                    <Ionicons name={ass.icone as any} size={10} color={ass.cor} />
                    <Text style={[styles.assBadgeTexto, { color: ass.cor }]}>{ass.label}</Text>
                  </View>
                </View>
                <Text style={[styles.cardMotor, { color: tema.textoSec }]} numberOfLines={1}>
                  {item.motor}  ·  {item.tipoManutencao}
                </Text>
                {/* Thumbs de assinatura */}
                <View style={styles.signaturas}>
                  {/* Técnico */}
                  <TouchableOpacity
                    style={[styles.signaturaBox, { borderColor: temTec ? '#16a34a55' : tema.borda, backgroundColor: temTec ? '#16a34a0a' : tema.fundo }]}
                    onPress={(e) => { e.stopPropagation(); if (temTec) { setPreviewOS(item); setPreviewTipo('tecnico'); } else { onAbrirOS(item.id); } }}
                    activeOpacity={0.8}
                  >
                    {temTec ? (
                      <Image source={{ uri: item.assinaturaTecnico! }} style={styles.signaturaImg} resizeMode="contain" />
                    ) : (
                      <View style={styles.signaturaVazia}>
                        <Ionicons name="create-outline" size={14} color={tema.textoFraco} />
                        <Text style={[styles.signaturaVaziaTexto, { color: tema.textoFraco }]}>Técnico</Text>
                      </View>
                    )}
                    <View style={[styles.signaturaPill, { backgroundColor: temTec ? '#16a34a' : tema.borda }]}>
                      <Text style={[styles.signaturaPillTexto, { color: temTec ? '#fff' : tema.textoFraco }]}>
                        {temTec ? '✓ Tec' : 'Tec'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Cliente */}
                  <TouchableOpacity
                    style={[styles.signaturaBox, { borderColor: temCli ? '#2563eb55' : tema.borda, backgroundColor: temCli ? '#2563eb0a' : tema.fundo }]}
                    onPress={(e) => { e.stopPropagation(); if (temCli) { setPreviewOS(item); setPreviewTipo('cliente'); } else { onAbrirOS(item.id); } }}
                    activeOpacity={0.8}
                  >
                    {temCli ? (
                      <Image source={{ uri: item.assinaturaCliente! }} style={styles.signaturaImg} resizeMode="contain" />
                    ) : (
                      <View style={styles.signaturaVazia}>
                        <Ionicons name="business-outline" size={14} color={tema.textoFraco} />
                        <Text style={[styles.signaturaVaziaTexto, { color: tema.textoFraco }]}>Cliente</Text>
                      </View>
                    )}
                    <View style={[styles.signaturaPill, { backgroundColor: temCli ? '#2563eb' : tema.borda }]}>
                      <Text style={[styles.signaturaPillTexto, { color: temCli ? '#fff' : tema.textoFraco }]}>
                        {temCli ? '✓ Cli' : 'Cli'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.cardData, { color: tema.textoFraco }]}>{item.dataCriacao}  ·  {item.status}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Preview de assinatura */}
      <Modal
        visible={previewOS !== null && previewTipo !== null}
        animationType="fade"
        transparent
        onRequestClose={() => { setPreviewOS(null); setPreviewTipo(null); }}
      >
        <View style={styles.previewFundo}>
          <View style={[styles.previewBox, { backgroundColor: tema.card }]}>
            <View style={styles.previewHeader}>
              <Text style={[styles.previewTitulo, { color: tema.texto }]}>
                Assinatura — {previewTipo === 'tecnico' ? 'Técnico' : 'Cliente'}
              </Text>
              <TouchableOpacity onPress={() => { setPreviewOS(null); setPreviewTipo(null); }}>
                <Ionicons name="close" size={22} color={tema.textoMuted} />
              </TouchableOpacity>
            </View>
            {previewOS && previewTipo && (
              <>
                <Text style={[styles.previewCliente, { color: tema.textoSec }]}>{previewOS.cliente}</Text>
                <View style={styles.previewImgBox}>
                  <Image
                    source={{ uri: previewTipo === 'tecnico' ? previewOS.assinaturaTecnico! : previewOS.assinaturaCliente! }}
                    style={styles.previewImg}
                    resizeMode="contain"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.previewAbrirBtn, { backgroundColor: tema.primario + '1a', borderColor: tema.primario + '44' }]}
                  onPress={() => { setPreviewOS(null); setPreviewTipo(null); onAbrirOS(previewOS.id); }}
                >
                  <Ionicons name="open-outline" size={14} color={tema.primario} />
                  <Text style={[styles.previewAbrirTexto, { color: tema.primario }]}>Abrir OS completa</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    subtitulo: { fontSize: 11, marginTop: 1 },
    statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 14 },
    statCard: {
      flex: 1, borderRadius: 13, borderWidth: 1, padding: 12,
      alignItems: 'center', gap: 4,
    },
    statNum: { fontSize: 20, fontWeight: '800' },
    statLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
    filtrosScroll: { paddingHorizontal: 20, paddingBottom: 10, gap: 7 },
    filtroChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 11, paddingVertical: 6, borderRadius: 16, borderWidth: 1,
    },
    filtroTexto: { fontSize: 12, fontWeight: '600' },
    filtroCount: { minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
    filtroCountTexto: { fontSize: 9, fontWeight: '700' },
    lista: { paddingHorizontal: 20, paddingBottom: 40 },
    listaVazia: { flexGrow: 1 },
    vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 40 },
    vazioIcone: { width: 64, height: 64, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    vazioTitulo: { fontSize: 15, fontWeight: '700' },
    card: {
      flexDirection: 'row', borderRadius: 14, borderWidth: 1,
      marginBottom: 10, overflow: 'hidden',
    },
    cardBarra: { width: 3, alignSelf: 'stretch' },
    cardCorpo: { flex: 1, padding: 13 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    cardCliente: { fontSize: 14, fontWeight: '700', flex: 1 },
    assBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, borderWidth: 1, marginLeft: 6,
    },
    assBadgeTexto: { fontSize: 9, fontWeight: '700' },
    cardMotor: { fontSize: 11, marginBottom: 8 },
    signaturas: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    signaturaBox: {
      flex: 1, borderRadius: 10, borderWidth: 1, overflow: 'hidden',
    },
    signaturaImg: { width: '100%', height: 52, backgroundColor: '#ffffff' },
    signaturaVazia: {
      height: 52, alignItems: 'center', justifyContent: 'center', gap: 3,
    },
    signaturaVaziaTexto: { fontSize: 10 },
    signaturaPill: {
      paddingVertical: 3, alignItems: 'center',
    },
    signaturaPillTexto: { fontSize: 9, fontWeight: '700' },
    cardData: { fontSize: 10 },
    // Preview modal
    previewFundo: { flex: 1, backgroundColor: '#000000bb', alignItems: 'center', justifyContent: 'center', padding: 24 },
    previewBox: { borderRadius: 20, padding: 20, width: '100%', maxWidth: 400 },
    previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    previewTitulo: { fontSize: 16, fontWeight: '700' },
    previewCliente: { fontSize: 12, marginBottom: 14 },
    previewImgBox: { backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden', marginBottom: 14 },
    previewImg: { width: '100%', height: 160 },
    previewAbrirBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      borderRadius: 12, paddingVertical: 11, borderWidth: 1,
    },
    previewAbrirTexto: { fontSize: 13, fontWeight: '600' },
  });
}
