import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../contexts/ThemeContext';
import { AppTema, TEMAS_PRESET, CORES_FUNDO, CORES_PRIMARIO } from '../utils/temas';
import ColorPicker from '../components/ColorPicker';

type Props = { onVoltar: () => void };

type SlotCor = 'fundo' | 'card' | 'borda' | 'primario' | null;

const LABELS_SLOT: Record<string, string> = {
  fundo: 'Cor de Fundo',
  card: 'Cor dos Cards',
  borda: 'Cor das Bordas',
  primario: 'Cor Primária',
};

function PreviewTema({ t }: { t: AppTema }) {
  return (
    <View style={[pv.container, { backgroundColor: t.fundo, borderColor: t.borda }]}>
      <View style={[pv.header, { backgroundColor: t.card, borderBottomColor: t.borda }]}>
        <View style={[pv.dot, { backgroundColor: t.primario }]} />
        <View style={[pv.barra, { backgroundColor: t.textoMuted, width: 40 }]} />
      </View>
      <View style={pv.body}>
        <View style={[pv.card, { backgroundColor: t.card, borderColor: t.borda }]}>
          <View style={[pv.barra, { backgroundColor: t.primario, width: 24 }]} />
          <View style={[pv.barra, { backgroundColor: t.textoMuted, width: 36, marginTop: 3 }]} />
        </View>
        <View style={[pv.card, { backgroundColor: t.card, borderColor: t.borda }]}>
          <View style={[pv.barra, { backgroundColor: t.primario, width: 18 }]} />
          <View style={[pv.barra, { backgroundColor: t.textoMuted, width: 28, marginTop: 3 }]} />
        </View>
      </View>
      <View style={[pv.fab, { backgroundColor: t.primario }]} />
    </View>
  );
}

const pv = StyleSheet.create({
  container: {
    width: 100, height: 78, borderRadius: 10, borderWidth: 1,
    overflow: 'hidden', position: 'relative',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    padding: 5, borderBottomWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  body: { flex: 1, padding: 5, gap: 4 },
  card: { flex: 1, borderRadius: 4, borderWidth: 1, padding: 4 },
  barra: { height: 4, borderRadius: 2 },
  fab: {
    position: 'absolute', bottom: 6, right: 6,
    width: 14, height: 14, borderRadius: 7,
  },
});

export default function TemaAppScreen({ onVoltar }: Props) {
  const { tema, setTema } = useThemeContext();
  const [temaEdit, setTemaEdit] = useState<AppTema>({ ...tema });
  const [slotAberto, setSlotAberto] = useState<SlotCor>(null);
  const [salvando, setSalvando] = useState(false);

  const styles = useMemo(() => criarEstilos(tema), [tema]);

  function selecionarPreset(preset: AppTema) {
    setTemaEdit({ ...preset });
  }

  async function handleSalvar() {
    setSalvando(true);
    await setTema(temaEdit);
    setSalvando(false);
    Alert.alert('Tema aplicado!', `Tema "${temaEdit.nome}" ativado.`);
  }

  function atualizarCor(slot: keyof AppTema, cor: string) {
    setTemaEdit((prev) => ({ ...prev, [slot]: cor }));
  }

  const SLOTS: { chave: keyof AppTema; label: string; cores: string[] }[] = [
    { chave: 'fundo', label: 'Fundo', cores: CORES_FUNDO },
    { chave: 'card', label: 'Cards', cores: CORES_FUNDO },
    { chave: 'borda', label: 'Bordas', cores: CORES_FUNDO },
    { chave: 'primario', label: 'Primária', cores: CORES_PRIMARIO },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={styles.voltarBotao}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Tema do App</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Presets */}
        <Text style={styles.secaoLabel}>Temas pré-definidos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
          {TEMAS_PRESET.map((preset) => {
            const ativo = temaEdit.id === preset.id;
            return (
              <TouchableOpacity
                key={preset.id}
                style={[styles.presetCard, ativo && { borderColor: tema.primario, borderWidth: 2 }]}
                onPress={() => selecionarPreset(preset)}
                activeOpacity={0.8}
              >
                <PreviewTema t={preset} />
                <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                <Text style={styles.presetNome}>{preset.nome}</Text>
                {ativo && (
                  <View style={[styles.presetCheck, { backgroundColor: tema.primario }]}>
                    <Ionicons name="checkmark" size={12} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Preview do tema em edição */}
        <View style={[styles.editCard, { backgroundColor: temaEdit.card, borderColor: temaEdit.borda }]}>
          <Text style={[styles.editCardTitulo, { color: temaEdit.texto }]}>
            {temaEdit.emoji} {temaEdit.nome}
          </Text>
          <Text style={[styles.editCardDesc, { color: temaEdit.textoMuted }]}>
            {temaEdit.descricao}
          </Text>
        </View>

        {/* Editor de cores */}
        <Text style={styles.secaoLabel}>Personalizar cores</Text>
        <View style={[styles.card, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          {SLOTS.map(({ chave, label, cores }) => (
            <TouchableOpacity
              key={chave}
              style={styles.corLinha}
              onPress={() => setSlotAberto(chave as SlotCor)}
              activeOpacity={0.8}
            >
              <View style={[styles.corPreview, { backgroundColor: temaEdit[chave] as string }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.corLabel}>{label}</Text>
                <Text style={styles.corHex}>{temaEdit[chave] as string}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={tema.textoMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Botão salvar */}
        <TouchableOpacity
          style={[styles.salvarBtn, { backgroundColor: tema.primario }, salvando && { opacity: 0.6 }]}
          onPress={handleSalvar}
          disabled={salvando}
          activeOpacity={0.9}
        >
          <Ionicons name="color-palette-outline" size={18} color="#ffffff" />
          <Text style={styles.salvarTexto}>{salvando ? 'Aplicando...' : 'Aplicar Tema'}</Text>
        </TouchableOpacity>

      </ScrollView>

      {slotAberto && (
        <ColorPicker
          visivel
          titulo={LABELS_SLOT[slotAberto]}
          corAtual={temaEdit[slotAberto] as string}
          cores={SLOTS.find((s) => s.chave === slotAberto)?.cores ?? CORES_PRIMARIO}
          onSalvar={(cor) => atualizarCor(slotAberto as keyof AppTema, cor)}
          onFechar={() => setSlotAberto(null)}
        />
      )}
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
    titulo: { color: t.texto, fontSize: 17, fontWeight: '700' },
    scroll: { padding: 20, paddingTop: 8, paddingBottom: 40 },
    secaoLabel: {
      color: t.textoSec, fontSize: 12, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 8,
    },
    presetsRow: { gap: 12, paddingBottom: 16 },
    presetCard: {
      alignItems: 'center', backgroundColor: t.card,
      borderRadius: 14, padding: 10, borderWidth: 1, borderColor: t.borda,
      position: 'relative',
    },
    presetEmoji: { fontSize: 14, marginTop: 6 },
    presetNome: { color: t.textoSec, fontSize: 11, fontWeight: '600', marginTop: 2 },
    presetCheck: {
      position: 'absolute', top: 6, right: 6,
      width: 20, height: 20, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    editCard: {
      borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 20,
    },
    editCardTitulo: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
    editCardDesc: { fontSize: 12 },
    card: { borderRadius: 14, borderWidth: 1, marginBottom: 16 },
    corLinha: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      padding: 14, borderBottomWidth: 1, borderBottomColor: t.borda,
    },
    corPreview: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: t.borda },
    corLabel: { color: t.texto, fontSize: 14, fontWeight: '500' },
    corHex: { color: t.textoMuted, fontSize: 11, marginTop: 2, fontFamily: 'monospace' as any },
    salvarBtn: {
      borderRadius: 12, paddingVertical: 15,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    salvarTexto: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  });
}
