import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';

const VERSAO  = '1.0.0';
const ANO     = '2025';
const CRIADOR = 'Erick Trentini';

type SubTela = 'tema-app' | 'tema-pdf' | 'edicao-empresa' | 'alterar-senha' | 'licenca';
type Props = { onVoltar: () => void; onNavegar: (tela: SubTela) => void };

const MENU_APARENCIA = [
  { id: 'tema-app'  as SubTela, icone: 'color-palette-outline', cor: '#6366f1', titulo: 'Tema do App',  descricao: '5 temas • cores personalizadas' },
  { id: 'tema-pdf'  as SubTela, icone: 'document-text-outline',  cor: '#0891b2', titulo: 'Tema do PDF',  descricao: '5 modelos • cores customizáveis'  },
];

const MENU_CONTA = [
  { id: 'edicao-empresa' as SubTela, icone: 'business-outline',    cor: '#16a34a', titulo: 'Dados da Empresa', descricao: 'Nome, CNPJ, endereço e contato' },
  { id: 'alterar-senha'  as SubTela, icone: 'lock-closed-outline',  cor: '#d97706', titulo: 'Alterar Senha',   descricao: 'Atualize a senha da sua conta'    },
];

const MENU_LICENCA = [
  { id: 'licenca' as SubTela, icone: 'flash-outline', cor: '#6366f1', titulo: 'Minha Licença', descricao: 'Plano atual · Upgrade para Pro · R$ 50/mês' },
];

type ItemMenu = typeof MENU_APARENCIA[number];

export default function ConfiguracoesScreen({ onVoltar, onNavegar }: Props) {
  const tema   = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);

  function renderGrupo(titulo: string, itens: ItemMenu[]) {
    return (
      <View style={styles.grupo}>
        <Text style={styles.grupoLabel}>{titulo}</Text>
        <View style={[styles.card, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          {itens.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.item, idx < itens.length - 1 && { borderBottomWidth: 1, borderBottomColor: tema.borda }]}
              onPress={() => onNavegar(item.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.itemIcone, { backgroundColor: item.cor + '1a' }]}>
                <Ionicons name={item.icone as any} size={18} color={item.cor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitulo, { color: tema.texto }]}>{item.titulo}</Text>
                <Text style={[styles.itemDesc, { color: tema.textoMuted }]}>{item.descricao}</Text>
              </View>
              <View style={[styles.chevronBox, { backgroundColor: tema.fundo }]}>
                <Ionicons name="chevron-forward" size={14} color={tema.textoFraco} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} style={[styles.iconBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <Ionicons name="arrow-back" size={20} color={tema.texto} />
        </TouchableOpacity>
        <Text style={[styles.titulo, { color: tema.texto }]}>Configurações</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Banner do app */}
        <View style={[styles.banner, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <LinearGradient
            colors={[tema.primario + '22', tema.primario + '08'] as any}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={[styles.bannerLogo, { backgroundColor: tema.primario + '22', borderColor: tema.primario + '44' }]}>
            <Ionicons name="construct" size={26} color={tema.primario} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerNome, { color: tema.texto }]}>ServiOS</Text>
            <Text style={[styles.bannerSub, { color: tema.textoSec }]}>Gestão de Serviços Técnicos</Text>
            <View style={styles.bannerMeta}>
              <View style={[styles.bannerChip, { backgroundColor: tema.primario + '22' }]}>
                <Text style={[styles.bannerChipTexto, { color: tema.primario }]}>v{VERSAO}</Text>
              </View>
              <View style={[styles.bannerChip, { backgroundColor: tema.fundo }]}>
                <Text style={[styles.bannerChipTexto, { color: tema.textoMuted }]}>{ANO}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Licença — destaque */}
        <TouchableOpacity
          style={[styles.licencaCard, { borderColor: '#6366f144' }]}
          onPress={() => onNavegar('licenca')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#6366f1', '#8b5cf6'] as any}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.licencaGradient}
          >
            <View style={styles.licencaIconeBox}>
              <Ionicons name="flash" size={20} color="#f59e0b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.licencaTitulo}>Plano Gratuito</Text>
              <Text style={styles.licencaSub}>Fazer upgrade para Pro · R$ 50/mês</Text>
            </View>
            <View style={styles.licencaArrow}>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {renderGrupo('Aparência', MENU_APARENCIA)}
        {renderGrupo('Conta & Empresa', MENU_CONTA)}

        {/* Sobre */}
        <View style={styles.grupo}>
          <Text style={styles.grupoLabel}>Sobre</Text>
          <View style={[styles.card, { backgroundColor: tema.card, borderColor: tema.borda }]}>
            {[
              { label: 'Desenvolvedor', valor: CRIADOR,        icone: 'person-outline'   },
              { label: 'Versão',        valor: VERSAO,          icone: 'code-slash-outline' },
              { label: 'Plataforma',    valor: 'iOS · Android', icone: 'phone-portrait-outline' },
            ].map((row, idx, arr) => (
              <View
                key={row.label}
                style={[styles.sobreRow, idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: tema.borda }]}
              >
                <View style={styles.sobreLeft}>
                  <Ionicons name={row.icone as any} size={14} color={tema.textoMuted} />
                  <Text style={[styles.sobreLabel, { color: tema.textoSec }]}>{row.label}</Text>
                </View>
                <Text style={[styles.sobreValor, { color: tema.texto }]}>{row.valor}</Text>
              </View>
            ))}
          </View>
        </View>

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
    iconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    titulo: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
    scroll: { padding: 20, paddingBottom: 48 },
    banner: {
      flexDirection: 'row', gap: 14, padding: 18, borderRadius: 18, borderWidth: 1,
      marginBottom: 24, overflow: 'hidden',
    },
    bannerLogo: { width: 54, height: 54, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    bannerNome: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
    bannerSub: { fontSize: 12, marginTop: 3 },
    bannerMeta: { flexDirection: 'row', gap: 6, marginTop: 8 },
    bannerChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    bannerChipTexto: { fontSize: 11, fontWeight: '700' },
    grupo: { marginBottom: 20 },
    grupoLabel: {
      color: t.textoMuted, fontSize: 11, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
    },
    card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    item: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
    itemIcone: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    itemTitulo: { fontSize: 14, fontWeight: '700' },
    itemDesc: { fontSize: 11, marginTop: 2 },
    chevronBox: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    sobreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
    sobreLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sobreLabel: { fontSize: 13 },
    sobreValor: { fontSize: 13, fontWeight: '600' },
    rodape: { textAlign: 'center', fontSize: 11, marginTop: 8 },
    licencaCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
    licencaGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
    licencaIconeBox: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center', justifyContent: 'center',
    },
    licencaTitulo: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
    licencaSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
    licencaArrow: {
      width: 28, height: 28, borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center',
    },
  });
}
