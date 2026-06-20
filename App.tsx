import { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import CompanyRegisterScreen from './screens/CompanyRegisterScreen';
import HomeScreen from './screens/HomeScreen';
import OSListScreen from './screens/OSListScreen';
import OSFormScreen from './screens/OSFormScreen';
import OSDetailScreen from './screens/OSDetailScreen';
import ClientListScreen from './screens/ClientListScreen';
import ClientFormScreen from './screens/ClientFormScreen';
import AgendaScreen from './screens/AgendaScreen';
import RelatoriosScreen from './screens/RelatoriosScreen';
import TecnicosListScreen from './screens/TecnicosListScreen';
import TecnicoFormScreen from './screens/TecnicoFormScreen';
import { salvar, carregar, remover } from './utils/storage';

type Empresa = {
  nome: string;
  cnpj: string;
  telefone: string;
  segmento: string;
  cidade: string;
  estado: string;
};

type Tela =
  | 'home'
  | 'os-lista'
  | 'os-form'
  | 'os-detalhe'
  | 'clientes-lista'
  | 'clientes-form'
  | 'agenda'
  | 'relatorios'
  | 'tecnicos-lista'
  | 'tecnicos-form';

export default function App() {
  const [carregandoApp, setCarregandoApp] = useState(true);
  const [usuarioLogado, setUsuarioLogado] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [telaAtual, setTelaAtual] = useState<Tela>('home');
  const [osSelecionadaId, setOsSelecionadaId] = useState<string | null>(null);
  const [telaAnterior, setTelaAnterior] = useState<Tela>('home');

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

  function irPara(tela: Tela) {
    setTelaAnterior(telaAtual);
    setTelaAtual(tela);
  }

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
    const mapa: Record<string, Tela> = {
      os: 'os-lista',
      clientes: 'clientes-lista',
      agenda: 'agenda',
      relatorios: 'relatorios',
      tecnicos: 'tecnicos-lista',
    };
    if (mapa[id]) irPara(mapa[id]);
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
        onVoltar={() => irPara('home')}
        onNovaOS={() => irPara('os-form')}
        onAbrirOS={(id) => {
          setOsSelecionadaId(id);
          irPara('os-detalhe');
        }}
      />
    );
  }

  if (telaAtual === 'os-form') {
    return (
      <OSFormScreen
        onVoltar={() => irPara('os-lista')}
        onSalvo={() => irPara('os-lista')}
        onIrParaClientes={() => irPara('clientes-form')}
      />
    );
  }

  if (telaAtual === 'os-detalhe' && osSelecionadaId) {
    return (
      <OSDetailScreen
        osId={osSelecionadaId}
        onVoltar={() => irPara(telaAnterior === 'agenda' ? 'agenda' : 'os-lista')}
        onAlterado={() => {}}
      />
    );
  }

  if (telaAtual === 'clientes-lista') {
    return (
      <ClientListScreen
        onVoltar={() => irPara('home')}
        onNovoCliente={() => irPara('clientes-form')}
      />
    );
  }

  if (telaAtual === 'clientes-form') {
    return (
      <ClientFormScreen
        onVoltar={() => irPara('clientes-lista')}
        onSalvo={() => irPara('clientes-lista')}
      />
    );
  }

  if (telaAtual === 'agenda') {
    return (
      <AgendaScreen
        onVoltar={() => irPara('home')}
        onAbrirOS={(id) => {
          setOsSelecionadaId(id);
          irPara('os-detalhe');
        }}
      />
    );
  }

  if (telaAtual === 'relatorios') {
    return <RelatoriosScreen onVoltar={() => irPara('home')} />;
  }

  if (telaAtual === 'tecnicos-lista') {
    return (
      <TecnicosListScreen
        onVoltar={() => irPara('home')}
        onNovoTecnico={() => irPara('tecnicos-form')}
      />
    );
  }

  if (telaAtual === 'tecnicos-form') {
    return (
      <TecnicoFormScreen
        onVoltar={() => irPara('tecnicos-lista')}
        onSalvo={() => irPara('tecnicos-lista')}
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
