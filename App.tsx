import { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import CompanyRegisterScreen from './screens/CompanyRegisterScreen';
import HomeScreen from './screens/HomeScreen';
import OSListScreen from './screens/OSListScreen';
import OSFormScreen from './screens/OSFormScreen';
import { salvar, carregar, remover } from './utils/storage';
import ClientListScreen from './screens/ClientListScreen';
import ClientFormScreen from './screens/ClientFormScreen';

type Empresa = {
  nome: string;
  cnpj: string;
  telefone: string;
  segmento: string;
  cidade: string;
  estado: string;
};

type Tela = 'home' | 'os-lista' | 'os-form' | 'clientes-lista' | 'clientes-form';

export default function App() {
  const [carregandoApp, setCarregandoApp] = useState(true);
  const [usuarioLogado, setUsuarioLogado] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [telaAtual, setTelaAtual] = useState<Tela>('home');

  useEffect(() => {
    async function carregarDadosSalvos() {
      const usuarioSalvo = await carregar<string>('usuarioLogado');
      const empresaSalva = await carregar<Empresa>('empresa');
      if (usuarioSalvo) setUsuarioLogado(usuarioSalvo);
      if (empresaSalva) setEmpresa(empresaSalva);
      setCarregandoApp(false);
    }
    carregarDadosSalvos();
  }, []);

  async function handleLoginSuccess(nome: string) {
    setUsuarioLogado(nome);
    await salvar('usuarioLogado', nome);
  }

  async function handleEmpresaConcluida(dados: Empresa) {
    setEmpresa(dados);
    await salvar('empresa', dados);
  }

  async function handleSair() {
    setUsuarioLogado(null);
    setEmpresa(null);
    setTelaAtual('home');
    await remover('usuarioLogado');
    await remover('empresa');
  }

  function handleAbrirMenu(id: string) {
    if (id === 'os') {
      setTelaAtual('os-lista');
    }
    if (id === 'clientes') {
      setTelaAtual('clientes-lista');
    }
    // 'agenda', 'relatorios' entram nas próximas partes
  }

  if (carregandoApp) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!usuarioLogado) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (!empresa) {
    return <CompanyRegisterScreen onConcluir={handleEmpresaConcluida} />;
  }

  if (telaAtual === 'os-lista') {
    return (
      <OSListScreen
        onVoltar={() => setTelaAtual('home')}
        onNovaOS={() => setTelaAtual('os-form')}
      />
    );
  }

  if (telaAtual === 'os-form') {
    return (
      <OSFormScreen
        onVoltar={() => setTelaAtual('os-lista')}
        onSalvo={() => setTelaAtual('os-lista')}
        onIrParaClientes={() => setTelaAtual('clientes-form')}
      />
    );
  }
  if (telaAtual === 'clientes-lista') {
    return (
      <ClientListScreen
        onVoltar={() => setTelaAtual('home')}
        onNovoCliente={() => setTelaAtual('clientes-form')}
      />
    );
  }

  if (telaAtual === 'clientes-form') {
    return (
      <ClientFormScreen
        onVoltar={() => setTelaAtual('clientes-lista')}
        onSalvo={() => setTelaAtual('clientes-lista')}
      />
    );
  }

  return (
    <HomeScreen
      usuario={usuarioLogado}
      empresa={empresa}
      onSair={handleSair}
      onAbrirMenu={handleAbrirMenu}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0b1220',
    alignItems: 'center',
    justifyContent: 'center',
  },
});