import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carregar, salvar } from '../utils/storage';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';
import {
  CampoConfig, CAMPOS_PADRAO, SECAO_ICONES, SECAO_CORES,
} from '../utils/camposOS';

type Props = { onVoltar: () => void };

const CAMPOS_FIXOS = ['cliente', 'motor', 'tipoManutencao'];

export default function CamposOSScreen({ onVoltar }: Props) {
  const tema   = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);
  const [campos, setCampos] = useState<CampoConfig[]>(CAMPOS_PADRAO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      const salvo = await carregar<CampoConfig[]>('camposOS');
      if (salvo && salvo.length > 0) {
        // merge: preserva novos campos padrão, atualiza ativo dos existentes
        const merged = CAMPOS_PADRAO.map((padrao) => {
          const encontrado = salvo.find((s) => s.id === padrao.id);
          return encontrado ? { ...padrao, ativo: encontrado.ativo } : padrao;
        });
        setCampos(merged);
      }
    })();
  }, []);

  async function toggleCampo(id: string) {
    if (CAMPOS_FIXOS.includes(id)) return;
    const novos = campos.map((c) => c.id === id ? { ...c, ativo: !c.ativo } : c);
    setCampos(novos);
    await salvar('camposOS', novos);
  }

  async function resetar() {
    Alert.alert(
      'Restaurar padrões',
      'Isso vai redefinir todos os campos para a configuração original. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar', style: 'destructive',
          onPress: async () => {
            setCampos(CAMPOS_PADRAO);
            await salvar('camposOS', CAMPOS_PADRAO);
          },
        },
      ]
    );
  }

  async function ativarTodos() {
    const novos = campos.map((c) => ({ ...c, ativo: true }));
    setCampos(novos);
    await salvar('camposOS', novos);
  }

  const secoes = useMemo(() => {
    const acc: Record<string, CampoConfig[]> = {};
    for (const c of campos) {
      if (!acc[c.secao]) acc[c.secao] = [];
      acc[c.secao].push(c);
    }
    return acc;
  }, [campos]);

  const ativos   = campos.filter((c) => c.ativo || CAMPOS_FIXOS.includes(c.id)).length;
  const totalCfg = campos.filter((c) => !CAMPOS_FIXOS.includes(c.id)).length;
  const ativosUser = campos.filter((c) => c.ativo && !CAMPOS_FIXOS.includes(c.id)).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onVoltar}
          style={[styles.iconBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}
        >
          <Ionicons name="arrow-back" size={20} color={tema.texto} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.titulo, { color: tema.texto }]}>Campos da OS</Text>
          <Text style={[styles.subtitulo, { color: tema.textoMuted }]}>
            {ativosUser} de {totalCfg} campos opcionais ativos
          </Text>
        </View>
        <TouchableOpacity
          onPress={resetar}
          style={[styles.iconBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}
        >
          <Ionicons name="refresh-outline" size={18} color={tema.textoSec} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Intro */}
        <View style={[styles.introCard, { backgroundColor: tema.primario + '15', borderColor: tema.primario + '33' }]}>
          <Ionicons name="information-circle-outline" size={18} color={tema.primario} />
          <Text style={[styles.introTexto, { color: tema.textoSec }]}>
            Ative os campos que você quer ver na criação de uma OS. Os campos fixos (Cliente, Equipamento, Tipo) sempre aparecem.
          </Text>
        </View>

        {/* Ação rápida */}
        <TouchableOpacity
          style={[styles.ativarTodosBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}
          onPress={ativarTodos}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-done-outline" size={16} color={tema.primario} />
          <Text style={[styles.ativarTodosTexto, { color: tema.primario }]}>Ativar todos os campos</Text>
        </TouchableOpacity>

        {/* Campos fixos */}
        <View style={styles.secaoContainer}>
          <View style={styles.secaoHeader}>
            <View style={[styles.secaoIconeBox, { backgroundColor: '#64748b20' }]}>
              <Ionicons name="lock-closed-outline" size={13} color="#64748b" />
            </View>
            <Text style={[styles.secaoTitulo, { color: tema.textoMuted }]}>Campos Fixos</Text>
            <Text style={[styles.secaoSub, { color: tema.textoFraco }]}>Sempre visíveis</Text>
          </View>
          <View style={[styles.grupoCard, { backgroundColor: tema.card, borderColor: tema.borda }]}>
            {[
              { id: 'cliente',       label: 'Cliente',              descricao: 'Seleção do cliente vinculado à OS' },
              { id: 'motor',         label: 'Motor / Equipamento',  descricao: 'Identificação do equipamento atendido' },
              { id: 'tipoManutencao', label: 'Tipo de Manutenção',  descricao: 'Preventiva, Corretiva, Revisão...' },
            ].map((c, idx, arr) => (
              <View
                key={c.id}
                style={[
                  styles.campoItem,
                  idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: tema.borda },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.campoLabel, { color: tema.texto }]}>{c.label}</Text>
                  <Text style={[styles.campoDesc, { color: tema.textoFraco }]}>{c.descricao}</Text>
                </View>
                <View style={[styles.fixoBadge, { backgroundColor: tema.fundo }]}>
                  <Ionicons name="lock-closed" size={10} color={tema.textoFraco} />
                  <Text style={[styles.fixoBadgeTexto, { color: tema.textoFraco }]}>Fixo</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Seções configuráveis */}
        {Object.entries(secoes).map(([secao, itens]) => {
          const corSecao = SECAO_CORES[secao] ?? '#64748b';
          const iconeSecao = SECAO_ICONES[secao] ?? 'list-outline';
          const ativosSecao = itens.filter((c) => c.ativo).length;

          return (
            <View key={secao} style={styles.secaoContainer}>
              <View style={styles.secaoHeader}>
                <View style={[styles.secaoIconeBox, { backgroundColor: corSecao + '20' }]}>
                  <Ionicons name={iconeSecao as any} size={13} color={corSecao} />
                </View>
                <Text style={[styles.secaoTitulo, { color: tema.texto }]}>{secao}</Text>
                <View style={[styles.contadorBadge, {
                  backgroundColor: ativosSecao > 0 ? corSecao + '20' : tema.fundo,
                }]}>
                  <Text style={[styles.contadorTexto, {
                    color: ativosSecao > 0 ? corSecao : tema.textoFraco,
                  }]}>
                    {ativosSecao}/{itens.length}
                  </Text>
                </View>
              </View>

              <View style={[styles.grupoCard, { backgroundColor: tema.card, borderColor: tema.borda }]}>
                {itens.map((campo, idx) => (
                  <TouchableOpacity
                    key={campo.id}
                    style={[
                      styles.campoItem,
                      idx < itens.length - 1 && { borderBottomWidth: 1, borderBottomColor: tema.borda },
                      campo.ativo && { backgroundColor: corSecao + '08' },
                    ]}
                    onPress={() => toggleCampo(campo.id)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <View style={styles.campoTituloRow}>
                        <Text style={[styles.campoLabel, { color: tema.texto }]}>{campo.label}</Text>
                        {campo.ativo && (
                          <View style={[styles.ativoBadge, { backgroundColor: corSecao + '20' }]}>
                            <Text style={[styles.ativoBadgeTexto, { color: corSecao }]}>Ativo</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.campoDesc, { color: tema.textoFraco }]}>{campo.descricao}</Text>
                    </View>
                    <Switch
                      value={campo.ativo}
                      onValueChange={() => toggleCampo(campo.id)}
                      trackColor={{ false: tema.borda, true: corSecao + '80' }}
                      thumbColor={campo.ativo ? corSecao : tema.textoFraco}
                      ios_backgroundColor={tema.borda}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        <Text style={[styles.rodape, { color: tema.textoFraco }]}>
          As alterações são salvas automaticamente
        </Text>
      </ScrollView>
    </View>
  );
}

function criarEstilos(t: AppTema) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.fundo },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    },
    iconBtn: {
      width: 40, height: 40, borderRadius: 12, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    titulo: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
    subtitulo: { fontSize: 12, marginTop: 1 },
    scroll: { padding: 20, paddingBottom: 48 },

    introCard: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 10,
      borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16,
    },
    introTexto: { flex: 1, fontSize: 12, lineHeight: 18 },

    ativarTodosBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      borderRadius: 12, borderWidth: 1, paddingVertical: 12, marginBottom: 24,
    },
    ativarTodosTexto: { fontSize: 13, fontWeight: '700' },

    secaoContainer: { marginBottom: 20 },
    secaoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    secaoIconeBox: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
    secaoTitulo: { fontSize: 13, fontWeight: '700', flex: 1, letterSpacing: -0.2 },
    secaoSub: { fontSize: 10, fontWeight: '600' },
    contadorBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    contadorTexto: { fontSize: 10, fontWeight: '700' },

    grupoCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
    campoItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    campoTituloRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
    campoLabel: { fontSize: 14, fontWeight: '600' },
    campoDesc: { fontSize: 12, lineHeight: 17 },

    fixoBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    fixoBadgeTexto: { fontSize: 10, fontWeight: '600' },
    ativoBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    ativoBadgeTexto: { fontSize: 9, fontWeight: '700', letterSpacing: 0.2 },

    rodape: { textAlign: 'center', fontSize: 11, marginTop: 8 },
  });
}
