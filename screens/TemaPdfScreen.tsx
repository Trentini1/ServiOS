import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext, useThema } from '../contexts/ThemeContext';
import { PdfTema, PDF_TEMAS_PRESET, CORES_PRIMARIO } from '../utils/temas';
import ColorPicker from '../components/ColorPicker';

type Props = { onVoltar: () => void };
type SlotPdf = 'corHeader' | 'corAcento' | null;

const ICONES_ESTILO: Record<string, string> = {
  moderno: 'business-outline',
  listrado: 'list-outline',
  minimal: 'remove-outline',
  elegante: 'diamond-outline',
  industrial: 'hammer-outline',
};

function PreviewPdfCard({ t, ativo, primario }: { t: PdfTema; ativo: boolean; primario: string }) {
  return (
    <View style={[ppv.outer, ativo && { borderColor: primario, borderWidth: 2 }]}>
      {/* Mini PDF */}
      <View style={ppv.paper}>
        <View style={[ppv.header, { backgroundColor: t.corHeader }]}>
          <View style={[ppv.headerBarra, { backgroundColor: t.corTextoHeader + '88' }]} />
          <View style={[ppv.headerBarra, { backgroundColor: t.corTextoHeader + '55', width: 28 }]} />
        </View>
        <View style={ppv.body}>
          <View style={[ppv.secTitulo, { backgroundColor: t.corAcento }]} />
          <View style={ppv.linhas}>
            <View style={ppv.linha} />
            <View style={[ppv.linha, { width: '70%' }]} />
          </View>
          <View style={[ppv.secTitulo, { backgroundColor: t.corAcento, marginTop: 6 }]} />
          <View style={ppv.linhas}>
            <View style={ppv.linha} />
            <View style={[ppv.linha, { width: '80%' }]} />
            <View style={[ppv.linha, { width: '60%' }]} />
          </View>
        </View>
        <View style={[ppv.footer, { backgroundColor: t.corHeader + '22' }]} />
      </View>
    </View>
  );
}

const ppv = StyleSheet.create({
  outer: {
    borderRadius: 10, padding: 8, backgroundColor: '#111827',
    borderWidth: 1, borderColor: '#1f2937', alignItems: 'center',
  },
  paper: {
    width: 90, height: 116, backgroundColor: '#ffffff',
    borderRadius: 4, overflow: 'hidden',
  },
  header: { height: 24, padding: 4, gap: 3 },
  headerBarra: { height: 4, borderRadius: 2, width: 40 },
  body: { flex: 1, padding: 5 },
  secTitulo: { height: 4, borderRadius: 2, width: 40 },
  linhas: { gap: 3, marginTop: 4 },
  linha: { height: 3, borderRadius: 2, backgroundColor: '#e2e8f0', width: '100%' },
  footer: { height: 10 },
});

export default function TemaPdfScreen({ onVoltar }: Props) {
  const tema = useThema();
  const { pdfTema, setPdfTema } = useThemeContext();
  const [editando, setEditando] = useState<PdfTema>({ ...pdfTema });
  const [slotAberto, setSlotAberto] = useState<SlotPdf>(null);
  const [salvando, setSalvando] = useState(false);

  const styles = useMemo(() => criarEstilos(tema), [tema]);

  async function handleSalvar() {
    setSalvando(true);
    await setPdfTema(editando);
    setSalvando(false);
    Alert.alert('Salvo!', `Tema de PDF "${editando.nome}" aplicado.`);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={styles.voltarBotao}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Tema do PDF</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.secaoLabel}>Modelos de PDF</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modelosRow}>
          {PDF_TEMAS_PRESET.map((preset) => {
            const ativo = editando.id === preset.id;
            return (
              <TouchableOpacity
                key={preset.id}
                style={styles.modeloCard}
                onPress={() => setEditando({ ...preset })}
                activeOpacity={0.8}
              >
                <PreviewPdfCard t={preset} ativo={ativo} primario={tema.primario} />
                <Text style={styles.modeloNome}>{preset.nome}</Text>
                <View style={styles.modeloIconeRow}>
                  <Ionicons name={ICONES_ESTILO[preset.estiloTabela] as any} size={12} color={tema.textoMuted} />
                  <Text style={styles.modeloEstilo}>{preset.estiloTabela}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Editor de cores do PDF */}
        <Text style={styles.secaoLabel}>Personalizar cores</Text>
        <View style={[styles.card, { borderColor: tema.borda }]}>
          {([
            { chave: 'corHeader' as const, label: 'Cor do Cabeçalho', desc: 'Fundo do topo do documento' },
            { chave: 'corAcento' as const, label: 'Cor de Destaque', desc: 'Títulos de seção e tabelas' },
          ]).map(({ chave, label, desc }) => (
            <TouchableOpacity
              key={chave}
              style={[styles.corLinha, { borderBottomColor: tema.borda }]}
              onPress={() => setSlotAberto(chave)}
              activeOpacity={0.8}
            >
              <View style={[styles.corSwatch, { backgroundColor: editando[chave] }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.corLabel}>{label}</Text>
                <Text style={styles.corDesc}>{desc}</Text>
                <Text style={styles.corHex}>{editando[chave]}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={tema.textoMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview info */}
        <View style={[styles.infoCard, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Ionicons name="information-circle-outline" size={16} color={tema.textoMuted} />
          <Text style={[styles.infoTexto, { color: tema.textoMuted }]}>
            As cores do texto sobre o cabeçalho são ajustadas automaticamente. O PDF usa o tema padrão mas pode ser sobrescrito por OS na tela de detalhes.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.salvarBtn, { backgroundColor: tema.primario }, salvando && { opacity: 0.6 }]}
          onPress={handleSalvar}
          disabled={salvando}
          activeOpacity={0.9}
        >
          <Ionicons name="document-text-outline" size={18} color="#ffffff" />
          <Text style={styles.salvarTexto}>{salvando ? 'Salvando...' : 'Aplicar Tema de PDF'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {slotAberto && (
        <ColorPicker
          visivel
          titulo={slotAberto === 'corHeader' ? 'Cor do Cabeçalho' : 'Cor de Destaque'}
          corAtual={editando[slotAberto]}
          cores={CORES_PRIMARIO}
          onSalvar={(cor) => setEditando((p) => ({ ...p, [slotAberto]: cor }))}
          onFechar={() => setSlotAberto(null)}
        />
      )}
    </View>
  );
}

function criarEstilos(t: ReturnType<typeof useThema>) {
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
    titulo: { color: t.texto, fontSize: 17, fontWeight: '700' },
    scroll: { padding: 20, paddingTop: 8, paddingBottom: 40 },
    secaoLabel: {
      color: t.textoSec, fontSize: 12, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 8,
    },
    modelosRow: { gap: 12, paddingBottom: 16 },
    modeloCard: { alignItems: 'center', gap: 6 },
    modeloNome: { color: t.texto, fontSize: 11, fontWeight: '600', textAlign: 'center', maxWidth: 106 },
    modeloIconeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    modeloEstilo: { color: t.textoMuted, fontSize: 10 },
    card: { backgroundColor: t.card, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
    corLinha: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      padding: 14, borderBottomWidth: 1,
    },
    corSwatch: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#ffffff22' },
    corLabel: { color: t.texto, fontSize: 14, fontWeight: '600' },
    corDesc: { color: t.textoMuted, fontSize: 11, marginTop: 1 },
    corHex: { color: t.textoFraco, fontSize: 10, marginTop: 2 },
    infoCard: {
      flexDirection: 'row', gap: 8, padding: 14,
      borderRadius: 12, borderWidth: 1, marginBottom: 16,
    },
    infoTexto: { flex: 1, fontSize: 12, lineHeight: 18 },
    salvarBtn: {
      borderRadius: 12, paddingVertical: 15,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    salvarTexto: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  });
}
