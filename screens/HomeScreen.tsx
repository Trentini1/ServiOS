import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Empresa = {
  nome: string;
  cnpj: string;
  telefone: string;
  segmento: string;
  cidade: string;
  estado: string;
};

type Props = {
  usuario: string;
  empresa: Empresa;
  onSair: () => void;
  onAbrirMenu: (id: string) => void;
};

const MENU = [
  { id: 'os', titulo: 'Ordens de Serviço', icone: 'document-text-outline', cor: '#2563eb' },
  { id: 'clientes', titulo: 'Clientes', icone: 'people-outline', cor: '#16a34a' },
  { id: 'agenda', titulo: 'Agenda', icone: 'calendar-outline', cor: '#d97706' },
  { id: 'relatorios', titulo: 'Relatórios', icone: 'bar-chart-outline', cor: '#9333ea' },
] as const;

export default function HomeScreen({ usuario, empresa, onSair, onAbrirMenu }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

function abrirMenu(id: string) {
    onAbrirMenu(id);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View>
            <Text style={styles.saudacao}>Olá, {usuario.split(' ')[0]} 👋</Text>
            <Text style={styles.empresaNome}>{empresa.nome}</Text>
          </View>
          <TouchableOpacity style={styles.avatarBotao} onPress={onSair}>
            <Ionicons name="log-out-outline" size={20} color="#f87171" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.resumoCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.resumoItem}>
            <Text style={styles.resumoNumero}>0</Text>
            <Text style={styles.resumoLabel}>OS abertas</Text>
          </View>
          <View style={styles.resumoDivisor} />
          <View style={styles.resumoItem}>
            <Text style={styles.resumoNumero}>0</Text>
            <Text style={styles.resumoLabel}>Clientes</Text>
          </View>
          <View style={styles.resumoDivisor} />
          <View style={styles.resumoItem}>
            <Text style={styles.resumoNumero}>0</Text>
            <Text style={styles.resumoLabel}>Agendados</Text>
          </View>
        </Animated.View>

        <Text style={styles.secaoTitulo}>Acesso rápido</Text>

        <Animated.View
          style={[
            styles.grid,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {MENU.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              onPress={() => abrirMenu(item.id)}
              activeOpacity={0.85}
            >
              <View style={[styles.menuIcone, { backgroundColor: item.cor + '22' }]}>
                <Ionicons name={item.icone as any} size={24} color={item.cor} />
              </View>
              <Text style={styles.menuTitulo}>{item.titulo}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  saudacao: {
    color: '#94a3b8',
    fontSize: 14,
  },
  empresaNome: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  avatarBotao: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumoCard: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 28,
  },
  resumoItem: {
    flex: 1,
    alignItems: 'center',
  },
  resumoNumero: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  resumoLabel: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  resumoDivisor: {
    width: 1,
    backgroundColor: '#1f2937',
  },
  secaoTitulo: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuCard: {
    width: '47%',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  menuIcone: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  menuTitulo: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});