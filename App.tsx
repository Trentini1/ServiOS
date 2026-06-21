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
import ConfiguracoesScreen from './screens/ConfiguracoesScreen';
import TemaAppScreen from './screens/TemaAppScreen';
import TemaPdfScreen from './screens/TemaPdfScreen';
import EdicaoEmpresaScreen from './screens/EdicaoEmpresaScreen';
import AlterarSenhaScreen from './screens/AlterarSenhaScreen';
import LicencaScreen from './screens/LicencaScreen';
import CamposOSScreen from './screens/CamposOSScreen';
import { ThemeProvider } from './contexts/ThemeContext';
import { salvar, carregar, remover } from './utils/storage';

type Empresa = {
  nome: string; cnpj: string; telefone: string;
  segmento: string; cidade: string; estado: string;
  email?: string; endereco?: string;
};

type Usuario = { nome: string; email: string; senha: string };

type Tela =
  | 'home' | 'os-lista' | 'os-form' | 'os-detalhe'
  | 'clientes-lista' | 'clientes-form'
  | 'agenda' | 'relatorios'
  | 'tecnicos-lista' | 'tecnicos-form' | 'tecnico-editar'
  | 'configuracoes' | 'tema-app' | 'tema-pdf'
  | 'edicao-empresa' | 'alterar-senha' | 'licenca' | 'campos-os';

function AppInner() {
  const [carregandoApp, setCarregandoApp] = useState(true);
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [empresa, setEmpresa]             = useState<Empresa | null>(null);
  const [telaAtual, setTelaAtual]         = useState<Tela>('home');
  const [telaAnterior, setTelaAnterior]   = useState<Tela>('home');
  const [osSelecionadaId, setOsSelecionadaId]     = useState<string | null>(null);
  const [tecnicoEditandoId, setTecnicoEditandoId] = useState<string | null>(null);
  const [dataAgendadaOS, setDataAgendadaOS]       = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const usuarioSalvo = await carregar<Usuario | string>('usuarioLogado');
      const empresaSalva = await carregar<Empresa>('empresa');
      if (usuarioSalvo) {
        if (typeof usuarioSalvo === 'string') {
          await remover('usuarioLogado');
        } else {
          setUsuarioLogado(usuarioSalvo);
        }
      }
      if (empresaSalva) setEmpresa(empresaSalva);
      setCarregandoApp(false);
    })();
  }, []);

  function irPara(tela: Tela) {
    setTelaAnterior(telaAtual);
    setTelaAtual(tela);
  }

  async function handleLoginSuccess(usuario: Usuario) {
    setUsuarioLogado(usuario);
    await salvar('usuarioLogado', usuario);
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
  }

  function handleAbrirMenu(id: string) {
    const mapa: Record<string, Tela> = {
      os: 'os-lista', clientes: 'clientes-lista', agenda: 'agenda',
      relatorios: 'relatorios', tecnicos: 'tecnicos-lista',
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

  if (!usuarioLogado) return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  if (!empresa)       return <CompanyRegisterScreen onConcluir={handleEmpresaConcluida} />;

  if (telaAtual === 'os-lista') {
    return (
      <OSListScreen
        onVoltar={() => irPara('home')}
        onNovaOS={() => irPara('os-form')}
        onAbrirOS={(id) => { setOsSelecionadaId(id); irPara('os-detalhe'); }}
      />
    );
  }

  if (telaAtual === 'os-form') {
    return (
      <OSFormScreen
        onVoltar={() => { setDataAgendadaOS(undefined); irPara(telaAnterior === 'agenda' ? 'agenda' : 'os-lista'); }}
        onSalvo={() => { setDataAgendadaOS(undefined); irPara(telaAnterior === 'agenda' ? 'agenda' : 'os-lista'); }}
        onIrParaClientes={() => irPara('clientes-form')}
        dataAgendadaInicial={dataAgendadaOS}
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
        onAbrirOS={(id) => { setOsSelecionadaId(id); irPara('os-detalhe'); }}
      />
    );
  }

  if (telaAtual === 'relatorios') return <RelatoriosScreen onVoltar={() => irPara('home')} />;

  if (telaAtual === 'tecnicos-lista') {
    return (
      <TecnicosListScreen
        onVoltar={() => irPara('home')}
        onNovoTecnico={() => irPara('tecnicos-form')}
        onEditarTecnico={(id) => { setTecnicoEditandoId(id); irPara('tecnico-editar'); }}
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

  if (telaAtual === 'tecnico-editar' && tecnicoEditandoId) {
    return (
      <TecnicoFormScreen
        onVoltar={() => { setTecnicoEditandoId(null); irPara('tecnicos-lista'); }}
        onSalvo={() => { setTecnicoEditandoId(null); irPara('tecnicos-lista'); }}
        tecnicoId={tecnicoEditandoId}
      />
    );
  }

  if (telaAtual === 'configuracoes') {
    return (
      <ConfiguracoesScreen
        onVoltar={() => irPara('home')}
        onNavegar={(sub) => irPara(sub)}
      />
    );
  }

  if (telaAtual === 'tema-app')       return <TemaAppScreen      onVoltar={() => irPara('configuracoes')} />;
  if (telaAtual === 'tema-pdf')       return <TemaPdfScreen      onVoltar={() => irPara('configuracoes')} />;
  if (telaAtual === 'edicao-empresa') return <EdicaoEmpresaScreen onVoltar={() => irPara('configuracoes')} />;
  if (telaAtual === 'alterar-senha')  return <AlterarSenhaScreen  onVoltar={() => irPara('configuracoes')} />;
  if (telaAtual === 'licenca')   return <LicencaScreen    onVoltar={() => irPara('configuracoes')} />;
  if (telaAtual === 'campos-os') return <CamposOSScreen   onVoltar={() => irPara('configuracoes')} />;

  return (
    <HomeScreen
      usuario={usuarioLogado.nome}
      empresa={empresa}
      onSair={handleSair}
      onAbrirMenu={handleAbrirMenu}
      onAbrirConfiguracoes={() => irPara('configuracoes')}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0b1220', alignItems: 'center', justifyContent: 'center' },
});
