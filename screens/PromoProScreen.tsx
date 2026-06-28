import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W, height: H } = Dimensions.get('window');

const BENEFICIOS = [
  { icone: 'infinite-outline',        texto: 'OS ilimitadas por mês',                   destaque: true  },
  { icone: 'cloud-upload-outline',     texto: 'Backup automático na nuvem',               destaque: false },
  { icone: 'bar-chart-outline',        texto: 'Relatórios avançados com exportação',      destaque: false },
  { icone: 'people-outline',           texto: 'Múltiplos usuários e equipes',             destaque: false },
  { icone: 'chatbubble-ellipses-outline', texto: 'Suporte prioritário via WhatsApp',     destaque: false },
  { icone: 'document-text-outline',    texto: 'PDF personalizado com sua logo',           destaque: false },
];

type Props = {
  visivel: boolean;
  onFechar: () => void;
};

export default function PromoProScreen({ visivel, onFechar }: Props) {
  // animações principais
  const bgOpacity   = useRef(new Animated.Value(0)).current;
  const cardY       = useRef(new Animated.Value(60)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale  = useRef(new Animated.Value(0.5)).current;
  const badgeRotate = useRef(new Animated.Value(-8)).current;
  const precoScale  = useRef(new Animated.Value(0.85)).current;

  // animações dos benefícios (stagger)
  const itemAnims = useRef(BENEFICIOS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!visivel) return;

    // reset
    bgOpacity.setValue(0);
    cardY.setValue(60);
    cardOpacity.setValue(0);
    badgeScale.setValue(0.5);
    badgeRotate.setValue(-8);
    precoScale.setValue(0.85);
    itemAnims.forEach((a) => a.setValue(0));

    // sequência de entrada
    Animated.sequence([
      // 1) fundo aparece
      Animated.timing(bgOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      // 2) card sobe + badge pop
      Animated.parallel([
        Animated.spring(cardY,       { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(badgeScale,  { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
        Animated.timing(badgeRotate, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.spring(precoScale,  { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
      ]),
      // 3) benefícios entram em cascata
      Animated.stagger(70, itemAnims.map((a) =>
        Animated.spring(a, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true })
      )),
    ]).start();
  }, [visivel]);

  function handleAssinar() {
    Alert.alert(
      '🚀 Em breve!',
      'O sistema de pagamentos estará disponível em breve.\nVocê será notificado quando for liberado!',
      [{ text: 'OK, aguardo!' }]
    );
  }

  const badgeRot = badgeRotate.interpolate({
    inputRange: [-8, 0],
    outputRange: ['-8deg', '0deg'],
  });

  return (
    <Modal visible={visivel} transparent animationType="none" onRequestClose={onFechar}>
      {/* Fundo escuro animado */}
      <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>
        <LinearGradient
          colors={['#0f0520', '#1a0838', '#0d0520']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Círculos decorativos de fundo */}
        <View style={styles.circulo1} />
        <View style={styles.circulo2} />
        <View style={styles.circulo3} />

        {/* Botão fechar */}
        <TouchableOpacity style={styles.fecharBtn} onPress={onFechar} activeOpacity={0.7}>
          <View style={styles.fecharCirculo}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
          </View>
        </TouchableOpacity>

        {/* Conteúdo animado */}
        <Animated.View style={[
          styles.conteudo,
          { opacity: cardOpacity, transform: [{ translateY: cardY }] },
        ]}>

          {/* Badge PRO girando */}
          <Animated.View style={[
            styles.badgeWrap,
            { transform: [{ scale: badgeScale }, { rotate: badgeRot }] },
          ]}>
            <LinearGradient
              colors={['#f59e0b', '#fbbf24', '#f59e0b']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.badge}
            >
              <Ionicons name="flash" size={14} color="#78350f" />
              <Text style={styles.badgeTexto}>PLANO PRO</Text>
              <Ionicons name="flash" size={14} color="#78350f" />
            </LinearGradient>
          </Animated.View>

          {/* Título */}
          <Text style={styles.titulo}>Desbloqueie o{'\n'}ServiOS Pro</Text>
          <Text style={styles.subtitulo}>
            Tudo que você precisa para escalar seu negócio
          </Text>

          {/* Preço em destaque */}
          <Animated.View style={[styles.precoBox, { transform: [{ scale: precoScale }] }]}>
            <LinearGradient
              colors={['rgba(139,92,246,0.3)', 'rgba(99,102,241,0.15)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.precoGradient}
            >
              <View style={styles.precoTop}>
                <Text style={styles.precoLabel}>por apenas</Text>
                <View style={styles.precoDesconto}>
                  <Text style={styles.precoDescontoTexto}>PRIMEIRO MÊS GRÁTIS</Text>
                </View>
              </View>
              <View style={styles.precoRow}>
                <Text style={styles.precoCifrao}>R$</Text>
                <Text style={styles.precoValor}>50</Text>
                <Text style={styles.precoMes}>,00{'\n'}/mês</Text>
              </View>
              <Text style={styles.precoCancele}>Cancele quando quiser · Sem fidelidade</Text>
            </LinearGradient>
          </Animated.View>

          {/* Benefícios */}
          <View style={styles.beneficiosLista}>
            {BENEFICIOS.map((b, idx) => (
              <Animated.View
                key={b.texto}
                style={[
                  styles.beneficioItem,
                  {
                    opacity: itemAnims[idx],
                    transform: [{
                      translateX: itemAnims[idx].interpolate({
                        inputRange: [0, 1], outputRange: [20, 0],
                      }),
                    }],
                  },
                ]}
              >
                <View style={[styles.beneficioIcone, b.destaque && styles.beneficioIconeDestaque]}>
                  <Ionicons
                    name={b.icone as any}
                    size={14}
                    color={b.destaque ? '#f59e0b' : '#a78bfa'}
                  />
                </View>
                <Text style={[styles.beneficioTexto, b.destaque && styles.beneficioTextoDestaque]}>
                  {b.texto}
                </Text>
                {b.destaque && (
                  <View style={styles.novoBadge}>
                    <Text style={styles.novoBadgeTexto}>NOVO</Text>
                  </View>
                )}
              </Animated.View>
            ))}
          </View>

          {/* Botões */}
          <TouchableOpacity style={styles.assinarBtn} onPress={handleAssinar} activeOpacity={0.85}>
            <LinearGradient
              colors={['#8b5cf6', '#6366f1', '#4f46e5']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.assinarGradient}
            >
              <Ionicons name="flash" size={18} color="#fbbf24" />
              <Text style={styles.assinarTexto}>Assinar Agora</Text>
              <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onFechar} activeOpacity={0.6} style={styles.continuarBtn}>
            <Text style={styles.continuarTexto}>Continuar com o plano gratuito</Text>
          </TouchableOpacity>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20,
  },

  // Decorações de fundo
  circulo1: {
    position: 'absolute', width: 350, height: 350, borderRadius: 175,
    backgroundColor: '#6366f112', top: -80, right: -100,
  },
  circulo2: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    backgroundColor: '#8b5cf60e', bottom: 60, left: -80,
  },
  circulo3: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#f59e0b0a', top: '40%', right: -40,
  },

  fecharBtn: { position: 'absolute', top: 56, right: 20 },
  fecharCirculo: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  conteudo: { width: '100%', alignItems: 'center' },

  // Badge
  badgeWrap:  { marginBottom: 20 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
  },
  badgeTexto: { color: '#78350f', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },

  // Título
  titulo: {
    color: '#ffffff', fontSize: 30, fontWeight: '800',
    letterSpacing: -0.8, textAlign: 'center', lineHeight: 36, marginBottom: 8,
  },
  subtitulo: {
    color: 'rgba(255,255,255,0.55)', fontSize: 14,
    textAlign: 'center', marginBottom: 22,
  },

  // Preço
  precoBox:      { width: '100%', borderRadius: 18, overflow: 'hidden', marginBottom: 20 },
  precoGradient: {
    padding: 18,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)',
    borderRadius: 18,
  },
  precoTop:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  precoLabel:   { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  precoDesconto: {
    backgroundColor: '#f59e0b20', borderRadius: 6, borderWidth: 1, borderColor: '#f59e0b44',
    paddingHorizontal: 8, paddingVertical: 2,
  },
  precoDescontoTexto: { color: '#fbbf24', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  precoRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 2, marginBottom: 6 },
  precoCifrao: { color: 'rgba(255,255,255,0.7)', fontSize: 18, fontWeight: '700', marginTop: 8 },
  precoValor:  { color: '#ffffff', fontSize: 52, fontWeight: '900', letterSpacing: -2, lineHeight: 56 },
  precoMes:    { color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 20, marginTop: 12 },
  precoCancele:{ color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center' },

  // Benefícios
  beneficiosLista: { width: '100%', gap: 10, marginBottom: 24 },
  beneficioItem:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  beneficioIcone:  {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(167,139,250,0.15)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  beneficioIconeDestaque: { backgroundColor: 'rgba(245,158,11,0.15)' },
  beneficioTexto:         { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  beneficioTextoDestaque: { color: '#ffffff', fontWeight: '700' },
  novoBadge:              { backgroundColor: '#f59e0b20', borderRadius: 5, borderWidth: 1, borderColor: '#f59e0b44', paddingHorizontal: 5, paddingVertical: 2 },
  novoBadgeTexto:         { color: '#fbbf24', fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },

  // Botões
  assinarBtn:     { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  assinarGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 16,
    shadowColor: '#6366f1', shadowOpacity: 0.5, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  assinarTexto: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  continuarBtn:  { paddingVertical: 8 },
  continuarTexto: { color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecorationLine: 'underline' },
});
