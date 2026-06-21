import { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';

const VERSAO = '1.0.0';
const ANO = '2025';
const CRIADOR = 'Erick Trentini';

type SubTela = 'tema-app' | 'tema-pdf' | 'edicao-empresa' | 'alterar-senha';
type Props = { onVoltar: () => void; onNavegar: (tela: SubTela) => void };

type ItemMenu = {
  id: SubTela;
  icone: string;
  cor: string;
  titulo: string;
  descricao: string;
};

const MENU_APARENCIA: ItemMenu[] = [
  {
    id: 'tema-app',
    icone: 'color-palette-outline',
    cor: '#6366f1',
    titulo: 'Tema do App',
    descricao: '5 temas + personalização de cores',
  },
  {
    id: 'tema-pdf',
    icone: 'document-text-outline',
    cor: '#0891b2',
    titulo: 'Tema do PDF',
    descricao: '5 modelos + cores customizáveis',
  },
];

const MENU_CONTA: ItemMenu[] = [
  {
    id: 'edicao-empresa',
    icone: 'business-outline',
    cor: '#16a34a',
    titulo: 'Dados da Empresa',
    descricao: 'Nome, CNPJ, endereço e contato',
  },
  {
    id: 'alterar-senha',
    icone: 'lock-closed-outline',
    cor: '#d97706',
    titulo: 'Alterar Senha',
    descricao: 'Mude a senha da sua conta',
  },
];

export default function ConfiguracoesScreen({ onVoltar, onNavegar }: Props) {
  const tema = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);

  function renderGrupo(titulo: string, itens: ItemMenu[]) {
    return (
      <View style={styles.grupo}>
        <Text style={styles.grupoLabel}>{titulo}</Text>
        <View style={[styles.card, { borderColor: tema.borda }]}>
          {itens.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.item,
                idx < itens.length - 1 && { borderBottomWidth: 1, borderBottomColor: tema.borda },
              ]}
              onPress={() => onNavegar(item.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.itemIcone, { backgroundColor: item.cor + '22' }]}>
                <Ionicons name={item.icone as any} size={18} color={item.cor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitulo}>{item.titulo}</Text>
                <Text style={styles.itemDesc}>{item.descricao}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={tema.textoFraco} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={styles.voltarBotao}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Configurações</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Banner do app */}
        <View style={[styles.appBanner, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <View style={[styles.appLogoBox, { backgroundColor: tema.primario + '22', borderColor: tema.primario + '44' }]}>
            <Ionicons name="construct" size={28} color={tema.primario} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.appNome}>ServiOS</Text>
            <Text style={[styles.appSub, { color: tema.textoSec }]}>Gestão de Ordens de Serviço</Text>
            <View style={styles.appMetaRow}>
              <View style={[styles.appChip, { backgroundColor: tema.primario + '22' }]}>
                <Text style={[styles.appChipTexto, { color: tema.primario }]}>v{VERSAO}</Text>
              </View>
              <Text style={[styles.appAno, { color: tema.textoMuted }]}>{ANO}</Text>
            </View>
          </View>
        </View>

        {renderGrupo('Aparência', MENU_APARENCIA)}
        {renderGrupo('Conta & Empresa', MENU_CONTA)}

        {/* Sobre */}
        <View style={styles.grupo}>
          <Text style={styles.grupoLabel}>Sobre</Text>
          <View style={[styles.card, { borderColor: tema.borda }]}>
            {[
              { label: 'Desenvolvedor', valor: CRIADOR },
              { label: 'Versão', valor: VERSAO },
              { label: 'Ano', valor: ANO },
              { label: 'Plataforma', valor: 'iOS · Android' },
            ].map((row, idx, arr) => (
              <View
                key={row.label}
                style={[
                  styles.sobreRow,
                  idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: tema.borda },
                ]}
              >
                <Text style={styles.sobreLabel}>{row.label}</Text>
                <Text style={styles.sobreValor}>{row.valor}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Rodapé */}
        <Text style={[styles.rodape, { color: tema.textoFraco }]}>
          Feito com dedicação por {CRIADOR} · {ANO}
        </Text>
      </ScrollView>
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
    scroll: { padding: 20, paddingBottom: 40 },
    appBanner: {
      flexDirection: 'row', gap: 14, padding: 16,
      borderRadius: 16, borderWidth: 1, marginBottom: 24,
    },
    appLogoBox: {
      width: 56, height: 56, borderRadius: 14, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center',
    },
    appNome: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
    appSub: { fontSize: 12, marginTop: 2 },
    appMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    appChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    appChipTexto: { fontSize: 11, fontWeight: '700' },
    appAno: { fontSize: 12 },
    grupo: { marginBottom: 20 },
    grupoLabel: {
      color: t.textoSec, fontSize: 12, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
    },
    card: { backgroundColor: t.card, borderRadius: 14, borderWidth: 1 },
    item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    itemIcone: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    itemTitulo: { color: t.texto, fontSize: 14, fontWeight: '600' },
    itemDesc: { color: t.textoMuted, fontSize: 11, marginTop: 1 },
    sobreRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', padding: 14,
    },
    sobreLabel: { color: t.textoSec, fontSize: 13 },
    sobreValor: { color: t.texto, fontSize: 13, fontWeight: '600' },
    rodape: { textAlign: 'center', fontSize: 11, marginTop: 8 },
  });
}
