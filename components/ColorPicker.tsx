import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  visivel: boolean;
  titulo: string;
  corAtual: string;
  cores: string[];
  onSalvar: (cor: string) => void;
  onFechar: () => void;
};

function hexValido(hex: string) {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

export default function ColorPicker({ visivel, titulo, corAtual, cores, onSalvar, onFechar }: Props) {
  const [selecionada, setSelecionada] = useState(corAtual);
  const [hexInput, setHexInput] = useState(corAtual);
  const [hexErro, setHexErro] = useState(false);

  function handleHexChange(v: string) {
    const formatado = v.startsWith('#') ? v : `#${v}`;
    setHexInput(formatado);
    setHexErro(false);
    if (hexValido(formatado)) {
      setSelecionada(formatado);
    }
  }

  function handleSelecionarPreset(cor: string) {
    setSelecionada(cor);
    setHexInput(cor);
    setHexErro(false);
  }

  function handleSalvar() {
    if (!hexValido(selecionada)) {
      setHexErro(true);
      return;
    }
    onSalvar(selecionada);
    onFechar();
  }

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar}>
      <Pressable style={styles.fundo} onPress={onFechar}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.titulo}>{titulo}</Text>

          {/* Preview */}
          <View style={styles.previewRow}>
            <View style={[styles.previewBox, { backgroundColor: corAtual }]}>
              <Text style={styles.previewLabel}>Atual</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color="#64748b" />
            <View style={[styles.previewBox, { backgroundColor: selecionada }]}>
              <Text style={styles.previewLabel}>Nova</Text>
            </View>
          </View>

          {/* Swatches */}
          <ScrollView
            style={styles.swatchScroll}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <View style={styles.swatchGrid}>
              {cores.map((cor) => (
                <TouchableOpacity
                  key={cor}
                  style={[styles.swatch, { backgroundColor: cor },
                    selecionada === cor && styles.swatchSelecionado]}
                  onPress={() => handleSelecionarPreset(cor)}
                  activeOpacity={0.8}
                >
                  {selecionada === cor && (
                    <Ionicons name="checkmark" size={14} color="#ffffff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Hex input */}
          <View style={styles.hexRow}>
            <View style={[styles.hexPreview, { backgroundColor: hexValido(hexInput) ? hexInput : '#374151' }]} />
            <TextInput
              style={[styles.hexInput, hexErro && { borderColor: '#f87171' }]}
              value={hexInput}
              onChangeText={handleHexChange}
              placeholder="#000000"
              placeholderTextColor="#475569"
              autoCapitalize="none"
              maxLength={7}
            />
            <Text style={styles.hexDica}>HEX</Text>
          </View>
          {hexErro && <Text style={styles.hexErroTexto}>Código HEX inválido</Text>}

          <View style={styles.botoes}>
            <TouchableOpacity style={styles.cancelarBtn} onPress={onFechar} activeOpacity={0.8}>
              <Text style={styles.cancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.salvarBtn} onPress={handleSalvar} activeOpacity={0.8}>
              <Text style={styles.salvarTexto}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#111827', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36, maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#374151', alignSelf: 'center', marginBottom: 16,
  },
  titulo: { color: '#ffffff', fontSize: 16, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  previewRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, marginBottom: 16,
  },
  previewBox: {
    width: 80, height: 48, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#1f2937',
  },
  previewLabel: { color: '#ffffff', fontSize: 10, fontWeight: '600' },
  swatchScroll: { maxHeight: 200 },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 4 },
  swatch: {
    width: 44, height: 44, borderRadius: 10,
    borderWidth: 2, borderColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  swatchSelecionado: { borderColor: '#ffffff', borderWidth: 2 },
  hexRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  hexPreview: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: '#374151' },
  hexInput: {
    flex: 1, backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    color: '#ffffff', fontSize: 15, fontFamily: 'monospace' as any,
  },
  hexDica: { color: '#64748b', fontSize: 11, fontWeight: '700' },
  hexErroTexto: { color: '#f87171', fontSize: 11, marginTop: 4, marginLeft: 46 },
  botoes: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelarBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 10,
    backgroundColor: '#1f2937', alignItems: 'center',
  },
  cancelarTexto: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  salvarBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 10,
    backgroundColor: '#2563eb', alignItems: 'center',
  },
  salvarTexto: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});
