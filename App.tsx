import { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
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
import LogoEmpresaScreen from './screens/LogoEmpresaScreen';
import PaywallScreen from './screens/PaywallScreen';
import ExcluirContaScreen from './screens/ExcluirContaScreen';
import { ThemeProvider } from './contexts/ThemeContext';
import { salvar, carregar, remover, salvarEmpresa, carregarEmpresa } from './utils/cloudStorage';
import { iniciarRevenueCat, verificarAssinatura, type StatusAssinatura } from './utils/subscription';

// Garante que o app continue funcionando (leitura e escrita) sem internet,
// sincronizando com o Firestore assim que a conexão voltar.
firestore().settings({ persistence: true });

type Empresa = {
  nome: string; cnpj: string; telefone: string;
  segmento: string; cidade: string; estado: string;
  email?: string; endereco?: string;
};

type Usuario = { nome: string; email: string; senha?: string };

type Tela =
  | 'home' | 'os-lista' | 'os-form' | 'os-detalhe' | 'os-editar'
  | 'clientes-lista' | 'clientes-form' | 'clientes-editar'
  | 'agenda' | 'relatorios'
  | 'tecnicos-lista' | 'tecnicos-form' | 'tecnico-editar'
  | 'configuracoes' | 'tema-app' | 'tema-pdf'
  | 'edicao-empresa' | 'alterar-senha' | 'licenca' | 'campos-os' | 'logo-empresa'
  | 'paywall' | 'excluir-conta';

function AppInner() {
  const [carregandoApp, setCarregandoApp] = useState(true);
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [uid, setUid]                     = useState<string>('');
  const [empresa, setEmpresa]             = useState<Empresa | null>(null);
  const [telaAtual, setTelaAtual]         = useState<Tela>('home');
  const [telaAnterior, setTelaAnterior]   = useState<Tela>('home');
  const [osSelecionadaId, setOsSelecionadaId]     = useState<string | null>(null);
  const [tecnicoEditandoId, setTecnicoEditandoId] = useState<string | null>(null);
  const [clienteEditandoId, setClienteEditandoId] = useState<string | null>(null);
  const [dataAgendadaOS, setDataAgendadaOS]       = useState<string | undefined>(undefined);
  const [statusAssinatura, setStatusAssinatura]   = useState<StatusAssinatura | null>(null);

  async function recarregarStatusAssinatura(uidAtual: string) {
    const status = await verificarAssinatura(uidAtual);
    setStatusAssinatura(status);
  }

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const nome = firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Usuário';
        setUsuarioLogado({ nome, email: firebaseUser.email ?? '', senha: '' });
        setUid(firebaseUser.uid);
        const empresaSalva = await carregarEmpresa(firebaseUser.uid);
        if (empresaSalva) setEmpresa(empresaSalva);
        await iniciarRevenueCat(firebaseUser.uid);
        await recarregarStatusAssinatura(firebaseUser.uid);
      } else {
        setUsuarioLogado(null);
        setUid('');
        setEmpresa(null);
        setStatusAssinatura(null);
      }
      setCarregandoApp(false);
    });
    return unsubscribe;
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
    await salvarEmpresa(uid, dados);
  }

  async function handleSair() {
    setTelaAtual('home');
    setEmpresa(null);
    await auth().signOut();
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

  if (!statusAssinatura) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const telasSempreAcessiveis: Tela[] = ['configuracoes', 'licenca', 'paywall', 'excluir-conta'];
  if (!statusAssinatura.ativo && !telasSempreAcessiveis.includes(telaAtual)) {
    return (
      <PaywallScreen
        uid={uid}
        podeIniciarTrial={!statusAssinatura.trialUsado}
        onLiberado={() => recarregarStatusAssinatura(uid)}
        onExcluirConta={() => irPara('excluir-conta')}
      />
    );
  }

  if (telaAtual === 'os-lista') {
    return (
      <OSListScreen
        uid={uid}
        onVoltar={() => irPara('home')}
        onNovaOS={() => irPara('os-form')}
        onAbrirOS={(id) => { setOsSelecionadaId(id); irPara('os-detalhe'); }}
      />
    );
  }

  if (telaAtual === 'os-form') {
    return (
      <OSFormScreen
        uid={uid}
        onVoltar={() => { setDataAgendadaOS(undefined); irPara(telaAnterior === 'agenda' ? 'agenda' : 'os-lista'); }}
        onSalvo={() => { setDataAgendadaOS(undefined); irPara(telaAnterior === 'agenda' ? 'agenda' : 'os-lista'); }}
        onIrParaClientes={() => irPara('clientes-form')}
        dataAgendadaInicial={dataAgendadaOS}
      />
    );
  }

  if (telaAtual === 'os-editar' && osSelecionadaId) {
    return (
      <OSFormScreen
        uid={uid}
        onVoltar={() => irPara('os-detalhe')}
        onSalvo={() => irPara('os-detalhe')}
        onIrParaClientes={() => irPara('clientes-form')}
        osId={osSelecionadaId}
      />
    );
  }

  if (telaAtual === 'os-detalhe' && osSelecionadaId) {
    return (
      <OSDetailScreen
        uid={uid}
        osId={osSelecionadaId}
        onVoltar={() => irPara(telaAnterior === 'agenda' ? 'agenda' : 'os-lista')}
        onAlterado={() => {}}
        onEditarOS={() => irPara('os-editar')}
      />
    );
  }

  if (telaAtual === 'clientes-lista') {
    return (
      <ClientListScreen
        uid={uid}
        onVoltar={() => irPara('home')}
        onNovoCliente={() => irPara('clientes-form')}
        onEditarCliente={(id) => { setClienteEditandoId(id); irPara('clientes-editar'); }}
      />
    );
  }

  if (telaAtual === 'clientes-form') {
    return (
      <ClientFormScreen
        uid={uid}
        onVoltar={() => irPara('clientes-lista')}
        onSalvo={() => irPara('clientes-lista')}
      />
    );
  }

  if (telaAtual === 'clientes-editar' && clienteEditandoId) {
    return (
      <ClientFormScreen
        uid={uid}
        onVoltar={() => { setClienteEditandoId(null); irPara('clientes-lista'); }}
        onSalvo={() => { setClienteEditandoId(null); irPara('clientes-lista'); }}
        clienteId={clienteEditandoId}
      />
    );
  }

  if (telaAtual === 'agenda') {
    return (
      <AgendaScreen
        uid={uid}
        onVoltar={() => irPara('home')}
        onAbrirOS={(id) => { setOsSelecionadaId(id); irPara('os-detalhe'); }}
      />
    );
  }

  if (telaAtual === 'relatorios') return <RelatoriosScreen uid={uid} onVoltar={() => irPara('home')} />;

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
        statusAssinatura={statusAssinatura}
        usuarioNome={usuarioLogado.nome}
        usuarioEmail={usuarioLogado.email}
      />
    );
  }

  if (telaAtual === 'tema-app')       return <TemaAppScreen      onVoltar={() => irPara('configuracoes')} />;
  if (telaAtual === 'tema-pdf')       return <TemaPdfScreen      onVoltar={() => irPara('configuracoes')} />;
  if (telaAtual === 'edicao-empresa') return <EdicaoEmpresaScreen uid={uid} onVoltar={() => irPara('configuracoes')} />;
  if (telaAtual === 'alterar-senha')  return <AlterarSenhaScreen  onVoltar={() => irPara('configuracoes')} />;
  if (telaAtual === 'licenca') {
    return (
      <LicencaScreen
        uid={uid}
        status={statusAssinatura}
        onVoltar={() => irPara('configuracoes')}
        onAbrirPaywall={() => irPara('paywall')}
      />
    );
  }
  if (telaAtual === 'paywall') {
    return (
      <PaywallScreen
        uid={uid}
        podeIniciarTrial={!statusAssinatura.trialUsado}
        onLiberado={() => { recarregarStatusAssinatura(uid); irPara('licenca'); }}
        onVoltar={() => irPara('licenca')}
      />
    );
  }
  if (telaAtual === 'excluir-conta') return <ExcluirContaScreen onVoltar={() => irPara(statusAssinatura.ativo ? 'configuracoes' : 'paywall')} />;
  if (telaAtual === 'campos-os')    return <CamposOSScreen    onVoltar={() => irPara('configuracoes')} />;
  if (telaAtual === 'logo-empresa') return <LogoEmpresaScreen onVoltar={() => irPara('configuracoes')} />;

  return (
    <HomeScreen
      uid={uid}
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
