import { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';

type Props = {
  visivel: boolean;
  titulo: string;
  onFechar: () => void;
  onSalvar: (assinaturaBase64: string) => void;
};

export default function SignatureModal({ visivel, titulo, onFechar, onSalvar }: Props) {
  const ref = useRef<SignatureViewRef>(null);

  function handleOK(assinatura: string) {
    onSalvar(assinatura);
    onFechar();
  }

  function limpar() {
    ref.current?.clearSignature();
  }

  function confirmar() {
    ref.current?.readSignature();
  }

  return (
    <Modal visible={visivel} animationType="slide" onRequestClose={onFechar}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.titulo}>{titulo}</Text>
          <TouchableOpacity onPress={onFechar} style={styles.fecharBotao}>
            <Ionicons name="close" size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <Text style={styles.instrucao}>Assine com o dedo na área abaixo</Text>

        <View style={styles.canvasContainer}>
          <SignatureScreen
            ref={ref}
            onOK={handleOK}
            webStyle={estiloCanvas}
            backgroundColor="#ffffff"
            penColor="#0b1220"
            descriptionText=""
          />
        </View>

        <View style={styles.botoes}>
          <TouchableOpacity style={styles.botaoLimpar} onPress={limpar} activeOpacity={0.8}>
            <Ionicons name="refresh" size={18} color="#f87171" />
            <Text style={styles.botaoLimparTexto}>Limpar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoConfirmar} onPress={confirmar} activeOpacity={0.9}>
            <Ionicons name="checkmark" size={18} color="#ffffff" />
            <Text style={styles.botaoConfirmarTexto}>Confirmar Assinatura</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Estilo da WebView interna (precisa ser CSS, não StyleSheet do RN)
const estiloCanvas = `
  .m-signature-pad { box-shadow: none; border: none; margin: 0; }
  .m-signature-pad--body { border: none; }
  .m-signature-pad--footer { display: none; }
  body, html { background-color: #ffffff; }
`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  titulo: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  fecharBotao: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instrucao: {
    color: '#64748b',
    fontSize: 13,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  canvasContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  botoes: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
  },
  botaoLimpar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8717122',
    borderWidth: 1,
    borderColor: '#f8717155',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 6,
  },
  botaoLimparTexto: {
    color: '#f87171',
    fontWeight: '600',
    fontSize: 14,
  },
  botaoConfirmar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    gap: 6,
  },
  botaoConfirmarTexto: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});