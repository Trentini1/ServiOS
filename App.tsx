import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>ServiOS</Text>
      <Text style={styles.subtitulo}>Sistema de Gestão Técnica</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
  subtitulo: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
});