import React, { useState, useRef, useEffect, useMemo, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, Animated,
  ScrollView, Modal, FlatList, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { carregar, listarClientes, listarOS, salvarOS, atualizarOS } from '../utils/cloudStorage';
import type { OrdemServico } from './OSListScreen';
import type { Cliente } from './ClientListScreen';
import type { Tecnico } from './TecnicosListScreen';
import { useThema } from '../contexts/ThemeContext';
import { AppTema } from '../utils/temas';
import { CampoConfig, CAMPOS_PADRAO, SECAO_CORES } from '../utils/camposOS';

const POSICOES       = ['BB', 'BE', 'Vante', 'Ré', 'Outro'];
const TIPOS          = ['Preventiva', 'Corretiva', 'Revisão', 'Instalação', 'Diagnóstico'];
const PRIORIDADES    = ['Baixa', 'Normal', 'Alta', 'Urgente'] as const;
const FORMAS_PAG     = ['PIX', 'Cartão', 'Boleto', 'Dinheiro', 'Transferência'];
const TIPOS_VEICULO  = ['Barco', 'Caminhão', 'Automóvel', 'Moto', 'Máquina', 'Outro'];

function formatarData(v: string) {
  const n = v.replace(/\D/g, '').slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
}

function dataParaISO(br: string): string | undefined {
  const p = br.split('/');
  if (p.length !== 3 || p[2].length !== 4) return undefined;
  return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
}

// Contexto para compartilhar tema e styles com os componentes auxiliares
// sem defini-los dentro do componente principal (evita remount no teclado)
type FormCtxType = { tema: AppTema; styles: ReturnType<typeof criarEstilos> };
const FormCtx = React.createContext<FormCtxType>({} as FormCtxType);

// ── Componentes auxiliares FORA do componente principal ─────────────────────
// IMPORTANTE: definir componentes dentro de outro componente faz o React
// tratá-los como tipos novos a cada render, causando unmount/remount e
// fechando o teclado a cada tecla digitada.

function Secao({ titulo, icone, cor, children }: {
  titulo: string; icone: string; cor: string; children: React.ReactNode;
}) {
  const { styles, tema } = useContext(FormCtx);
  return (
    <View style={styles.secao}>
      <View style={styles.secaoHeader}>
        <View style={[styles.secaoIcone, { backgroundColor: cor + '20' }]}>
          <Ionicons name={icone as any} size={13} color={cor} />
        </View>
        <Text style={[styles.secaoTitulo, { color: cor }]}>{titulo}</Text>
        <View style={[styles.secaoLinha, { backgroundColor: cor + '30' }]} />
      </View>
      <View style={[styles.secaoCard, { backgroundColor: tema.card, borderColor: tema.borda }]}>
        {children}
      </View>
    </View>
  );
}

function Campo({ children, separator }: { children: React.ReactNode; separator?: boolean }) {
  const { styles, tema } = useContext(FormCtx);
  return (
    <View style={[styles.campo, separator && { borderTopWidth: 1, borderTopColor: tema.borda }]}>
      {children}
    </View>
  );
}

function CampoLabel({ texto }: { texto: string }) {
  const { styles, tema } = useContext(FormCtx);
  return <Text style={[styles.campoLabel, { color: tema.textoMuted }]}>{texto}</Text>;
}

function InputTexto({ value, onChange, placeholder, icon, multiline, teclado, maxLen }: {
  value: string; onChange: (v: string) => void; placeholder: string;
  icon?: string; multiline?: boolean; teclado?: any; maxLen?: number;
}) {
  const { styles, tema } = useContext(FormCtx);
  return (
    <View style={[styles.inputRow, { backgroundColor: tema.fundo, borderColor: tema.borda }, multiline && styles.inputRowMultiline]}>
      {icon && <Ionicons name={icon as any} size={16} color={tema.textoFraco} />}
      <TextInput
        style={[styles.inputTexto, { color: tema.texto }, multiline && styles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor={tema.textoFraco}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={teclado}
        maxLength={maxLen}
      />
    </View>
  );
}

function Chips({ opcoes, selecionado, onSelect, cor }: {
  opcoes: readonly string[]; selecionado: string; onSelect: (v: string) => void; cor?: string;
}) {
  const { styles, tema } = useContext(FormCtx);
  const corAtiva = cor ?? tema.primario;
  return (
    <View style={styles.chipsRow}>
      {opcoes.map((op) => {
        const sel = selecionado === op;
        return (
          <TouchableOpacity
            key={op}
            style={[styles.chip, { borderColor: sel ? corAtiva : tema.borda, backgroundColor: sel ? corAtiva + '15' : tema.fundo }]}
            onPress={() => onSelect(sel ? '' : op)}
            activeOpacity={0.75}
          >
            {sel && <Ionicons name="checkmark" size={11} color={corAtiva} />}
            <Text style={[styles.chipTexto, { color: sel ? corAtiva : tema.textoMuted, fontWeight: sel ? '700' : '500' }]}>
              {op}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Seletor({ valor, placeholder, icon, onPress, onClear }: {
  label?: string; valor: string; placeholder: string; icon: string;
  onPress: () => void; onClear?: () => void;
}) {
  const { styles, tema } = useContext(FormCtx);
  return (
    <TouchableOpacity
      style={[styles.seletor, { backgroundColor: tema.fundo, borderColor: valor ? tema.primario + '55' : tema.borda }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon as any} size={16} color={valor ? tema.primario : tema.textoFraco} />
      <Text style={[styles.seletorTexto, { color: valor ? tema.texto : tema.textoFraco }]} numberOfLines={1}>
        {valor || placeholder}
      </Text>
      {valor && onClear ? (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={18} color={tema.textoFraco} />
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-down" size={16} color={tema.textoFraco} />
      )}
    </TouchableOpacity>
  );
}

// ── Componente principal ────────────────────────────────────────────────────

type Props = {
  uid: string;
  onVoltar: () => void;
  onSalvo: () => void;
  onIrParaClientes: () => void;
  dataAgendadaInicial?: string;
  osId?: string;
};

export default function OSFormScreen({ uid, onVoltar, onSalvo, onIrParaClientes, dataAgendadaInicial, osId }: Props) {
  const modoEdicao = !!osId;
  const tema   = useThema();
  const styles = useMemo(() => criarEstilos(tema), [tema]);

  const [clientes, setClientes]         = useState<Cliente[]>([]);
  const [tecnicos, setTecnicos]         = useState<Tecnico[]>([]);
  const [campos, setCampos]             = useState<CampoConfig[]>(CAMPOS_PADRAO);
  const [clienteSel, setClienteSel]     = useState<Cliente | null>(null);
  const [tecnicoSel, setTecnicoSel]     = useState<Tecnico | null>(null);
  const [modalCliente, setModalCliente] = useState(false);
  const [modalTecnico, setModalTecnico] = useState(false);

  const [motor, setMotor]                               = useState('');
  const [tipoManutencao, setTipoManutencao]             = useState('');
  const [posicao, setPosicao]                           = useState('');
  const [descricao, setDescricao]                       = useState('');
  const [prioridade, setPrioridade]                     = useState<'Baixa'|'Normal'|'Alta'|'Urgente'>('Normal');
  const [garantia, setGarantia]                         = useState(false);
  const [tempoEstimado, setTempoEstimado]               = useState('');
  const [numeroOS, setNumeroOS]                         = useState('');
  const [modelo, setModelo]                             = useState('');
  const [ano, setAno]                                   = useState('');
  const [placa, setPlaca]                               = useState('');
  const [horimetro, setHorimetro]                       = useState('');
  const [dataAgendada, setDataAgendada]                 = useState(dataAgendadaInicial ?? '');
  const [valorEstimado, setValorEstimado]               = useState('');
  const [formaPagamento, setFormaPagamento]             = useState('');
  const [solicitante, setSolicitante]                   = useState('');
  const [contatoSolicitante, setContatoSolicitante]     = useState('');
  const [enderecoServico, setEnderecoServico]           = useState('');
  const [observacoesInternas, setObservacoesInternas]   = useState('');
  const [tipoVeiculo, setTipoVeiculo]                   = useState('');
  const [seguro, setSeguro]                             = useState('');
  const [salvando, setSalvando]                         = useState(false);

  const fade      = useRef(new Animated.Value(0)).current;
  const scaleSave = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    (async () => {
      const [cls, tecs, cfg, ordensLista] = await Promise.all([
        listarClientes(uid),
        carregar<Tecnico[]>('tecnicos'),
        carregar<CampoConfig[]>('camposOS'),
        listarOS(uid),
      ]);
      const clsLista  = cls;
      const tecsLista = tecs ?? [];
      setClientes(clsLista);
      setTecnicos(tecsLista);
      if (cfg && cfg.length > 0) {
        const merged = CAMPOS_PADRAO.map((p) => {
          const s = cfg.find((c) => c.id === p.id);
          return s ? { ...p, ativo: s.ativo } : p;
        });
        setCampos(merged);
      }
      if (osId && ordensLista) {
        const os = ordensLista.find((o) => o.id === osId);
        if (os) {
          const cli = clsLista.find((c) => c.nome === os.cliente);
          if (cli) setClienteSel(cli);
          setMotor(os.motor ?? '');
          setTipoManutencao(os.tipoManutencao ?? '');
          setPosicao(os.posicao ?? '');
          setDescricao(os.descricao ?? '');
          setPrioridade((os as any).prioridade ?? 'Normal');
          setGarantia((os as any).garantia ?? false);
          setTempoEstimado((os as any).tempoEstimado ?? '');
          setNumeroOS((os as any).numeroOS ?? '');
          setModelo((os as any).modelo ?? '');
          setAno((os as any).ano ?? '');
          setPlaca((os as any).placa ?? '');
          setHorimetro((os as any).horimetro ?? '');
          setValorEstimado((os as any).valorEstimado ?? '');
          setFormaPagamento((os as any).formaPagamento ?? '');
          setSolicitante((os as any).solicitante ?? '');
          setContatoSolicitante((os as any).contatoSolicitante ?? '');
          setEnderecoServico((os as any).enderecoServico ?? '');
          setObservacoesInternas((os as any).observacoesInternas ?? '');
          setTipoVeiculo((os as any).tipoVeiculo ?? '');
          setSeguro((os as any).seguro ?? '');
          if (os.dataAgendada) {
            const partes = os.dataAgendada.split('-');
            setDataAgendada(`${partes[2]}/${partes[1]}/${partes[0]}`);
          }
          if (os.tecnicoResponsavel) {
            const tec = tecsLista.find((t) => t.nome === os.tecnicoResponsavel);
            if (tec) setTecnicoSel(tec);
          }
        }
      }
    })();
  }, []);

  function campoAtivo(id: string) {
    return campos.find((c) => c.id === id)?.ativo ?? false;
  }

  async function handleSalvar() {
    if (!clienteSel)     { Alert.alert('Atenção', 'Selecione o cliente.');              return; }
    if (!motor.trim())   { Alert.alert('Atenção', 'Informe o motor/equipamento.');      return; }
    if (!tipoManutencao) { Alert.alert('Atenção', 'Selecione o tipo de manutenção.');   return; }

    Animated.sequence([
      Animated.timing(scaleSave, { toValue: 0.96, duration: 70, useNativeDriver: true }),
      Animated.timing(scaleSave, { toValue: 1,    duration: 70, useNativeDriver: true }),
    ]).start();

    setSalvando(true);
    const novaOS: OrdemServico = {
      id: Date.now().toString(),
      cliente: clienteSel.nome,
      clienteTelefone: clienteSel.telefone,
      motor,
      tipoManutencao,
      posicao:              campoAtivo('posicao')              ? posicao              : undefined,
      descricao:            campoAtivo('descricao')            ? descricao            : undefined,
      status: 'Aberta',
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
      dataAgendada:         campoAtivo('dataAgendada') && dataAgendada   ? dataParaISO(dataAgendada) : undefined,
      tecnicoResponsavel:   campoAtivo('tecnico')      && tecnicoSel     ? tecnicoSel.nome           : undefined,
      prioridade:           campoAtivo('prioridade')           ? prioridade           : undefined,
      garantia:             campoAtivo('garantia')             ? garantia             : undefined,
      tempoEstimado:        campoAtivo('tempoEstimado') && tempoEstimado  ? tempoEstimado            : undefined,
      numeroOS:             campoAtivo('numeroOS')      && numeroOS       ? numeroOS                 : undefined,
      modelo:               campoAtivo('modelo')        && modelo         ? modelo                   : undefined,
      ano:                  campoAtivo('ano')            && ano            ? ano                      : undefined,
      placa:                campoAtivo('placa')          && placa          ? placa                    : undefined,
      horimetro:            campoAtivo('horimetro')      && horimetro      ? horimetro                : undefined,
      valorEstimado:        campoAtivo('valorEstimado')  && valorEstimado  ? valorEstimado            : undefined,
      formaPagamento:       campoAtivo('formaPagamento') && formaPagamento ? formaPagamento           : undefined,
      solicitante:          campoAtivo('solicitante')    && solicitante    ? solicitante              : undefined,
      contatoSolicitante:   campoAtivo('contatoSolicitante') && contatoSolicitante ? contatoSolicitante : undefined,
      enderecoServico:      campoAtivo('enderecoServico')     && enderecoServico     ? enderecoServico   : undefined,
      observacoesInternas:  campoAtivo('observacoesInternas') && observacoesInternas ? observacoesInternas : undefined,
      tipoVeiculo:          campoAtivo('tipoVeiculo')    && tipoVeiculo    ? tipoVeiculo              : undefined,
      seguro:               campoAtivo('seguro')         && seguro         ? seguro                   : undefined,
    };
    if (modoEdicao && osId) {
      const { id, dataCriacao, status, ...alteracoes } = novaOS;
      await atualizarOS(uid, osId, alteracoes);
    } else {
      await salvarOS(uid, novaOS);
    }
    setSalvando(false);
    onSalvo();
  }

  const PRIORIDADE_CORES: Record<string, string> = {
    Baixa: '#16a34a', Normal: tema.primario, Alta: '#d97706', Urgente: '#dc2626',
  };

  return (
    <FormCtx.Provider value={{ tema, styles }}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header com gradiente */}
        <View style={styles.headerWrap}>
          <LinearGradient
            colors={[tema.primario + '28', tema.fundo + '00'] as any}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <TouchableOpacity
            onPress={onVoltar}
            style={[styles.backBtn, { backgroundColor: tema.card, borderColor: tema.borda }]}
          >
            <Ionicons name="arrow-back" size={20} color={tema.texto} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.titulo, { color: tema.texto }]}>{modoEdicao ? 'Editar OS' : 'Nova OS'}</Text>
            <Text style={[styles.subtitulo, { color: tema.textoMuted }]}>Ordem de Serviço</Text>
          </View>
          <View style={[styles.osNumBadge, { backgroundColor: tema.primario + '20', borderColor: tema.primario + '40' }]}>
            <Ionicons name="document-text" size={12} color={tema.primario} />
            <Text style={[styles.osNumTexto, { color: tema.primario }]}>
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fade }}>

            {/* ── DADOS ESSENCIAIS ── */}
            <Secao titulo="Dados Essenciais" icone="star-outline" cor={tema.primario}>
              <Campo>
                <CampoLabel texto="Cliente *" />
                {clientes.length === 0 ? (
                  <TouchableOpacity style={[styles.alertaCliente, { backgroundColor: '#d9770618', borderColor: '#d9770644' }]} onPress={onIrParaClientes} activeOpacity={0.8}>
                    <Ionicons name="alert-circle-outline" size={16} color="#d97706" />
                    <Text style={styles.alertaClienteTexto}>Nenhum cliente cadastrado. Toque para cadastrar.</Text>
                  </TouchableOpacity>
                ) : (
                  <Seletor
                    valor={clienteSel?.nome ?? ''}
                    placeholder="Selecionar cliente"
                    icon="business-outline"
                    onPress={() => setModalCliente(true)}
                    onClear={() => setClienteSel(null)}
                  />
                )}
              </Campo>

              <Campo separator>
                <CampoLabel texto="Motor / Equipamento *" />
                <InputTexto value={motor} onChange={setMotor} placeholder="Ex: Motor Volvo Penta D13" icon="cog-outline" />
              </Campo>

              <Campo separator>
                <CampoLabel texto="Tipo de Manutenção *" />
                <Chips opcoes={TIPOS} selecionado={tipoManutencao} onSelect={setTipoManutencao} />
              </Campo>
            </Secao>

            {/* ── SERVIÇO ── */}
            {(campoAtivo('posicao') || campoAtivo('descricao') || campoAtivo('prioridade') || campoAtivo('garantia') || campoAtivo('tempoEstimado') || campoAtivo('numeroOS')) && (
              <Secao titulo="Serviço" icone="construct-outline" cor={SECAO_CORES['Serviço']}>
                {campoAtivo('posicao') && (
                  <Campo>
                    <CampoLabel texto="Posição" />
                    <Chips opcoes={POSICOES} selecionado={posicao} onSelect={setPosicao} cor={SECAO_CORES['Serviço']} />
                  </Campo>
                )}
                {campoAtivo('descricao') && (
                  <Campo separator={campoAtivo('posicao')}>
                    <CampoLabel texto="Descrição do Serviço" />
                    <InputTexto value={descricao} onChange={setDescricao} placeholder="Descreva o que será executado..." multiline />
                  </Campo>
                )}
                {campoAtivo('prioridade') && (
                  <Campo separator={campoAtivo('posicao') || campoAtivo('descricao')}>
                    <CampoLabel texto="Prioridade" />
                    <Chips opcoes={PRIORIDADES} selecionado={prioridade} onSelect={(v) => setPrioridade(v as any || 'Normal')} cor={PRIORIDADE_CORES[prioridade]} />
                  </Campo>
                )}
                {campoAtivo('garantia') && (
                  <Campo separator>
                    <View style={styles.switchRow}>
                      <View>
                        <Text style={[styles.switchLabel, { color: tema.texto }]}>Coberto por garantia</Text>
                        <Text style={[styles.switchSub, { color: tema.textoFraco }]}>O serviço está dentro do período de garantia</Text>
                      </View>
                      <Switch
                        value={garantia}
                        onValueChange={setGarantia}
                        trackColor={{ false: tema.borda, true: '#16a34a80' }}
                        thumbColor={garantia ? '#16a34a' : tema.textoFraco}
                      />
                    </View>
                  </Campo>
                )}
                {campoAtivo('tempoEstimado') && (
                  <Campo separator>
                    <CampoLabel texto="Tempo Estimado" />
                    <InputTexto value={tempoEstimado} onChange={setTempoEstimado} placeholder="Ex: 2 horas, 3 dias" icon="time-outline" />
                  </Campo>
                )}
                {campoAtivo('numeroOS') && (
                  <Campo separator>
                    <CampoLabel texto="Número da OS" />
                    <InputTexto value={numeroOS} onChange={setNumeroOS} placeholder="Ex: OS-2024-001" icon="barcode-outline" />
                  </Campo>
                )}
              </Secao>
            )}

            {/* ── EQUIPAMENTO ── */}
            {(campoAtivo('modelo') || campoAtivo('ano') || campoAtivo('placa') || campoAtivo('horimetro') || campoAtivo('tipoVeiculo')) && (
              <Secao titulo="Equipamento" icone="cog-outline" cor={SECAO_CORES['Equipamento']}>
                {campoAtivo('tipoVeiculo') && (
                  <Campo>
                    <CampoLabel texto="Tipo de Veículo" />
                    <Chips opcoes={TIPOS_VEICULO} selecionado={tipoVeiculo} onSelect={setTipoVeiculo} cor={SECAO_CORES['Equipamento']} />
                  </Campo>
                )}
                {campoAtivo('modelo') && (
                  <Campo separator={campoAtivo('tipoVeiculo')}>
                    <CampoLabel texto="Modelo" />
                    <InputTexto value={modelo} onChange={setModelo} placeholder="Ex: Civic EXL 2022" icon="car-outline" />
                  </Campo>
                )}
                {campoAtivo('ano') && (
                  <Campo separator>
                    <CampoLabel texto="Ano de Fabricação" />
                    <InputTexto value={ano} onChange={setAno} placeholder="Ex: 2023" icon="calendar-outline" teclado="numeric" maxLen={4} />
                  </Campo>
                )}
                {campoAtivo('placa') && (
                  <Campo separator>
                    <CampoLabel texto="Placa / Nº de Série" />
                    <InputTexto value={placa} onChange={(v) => setPlaca(v.toUpperCase())} placeholder="Ex: ABC-1234 ou SN123456" icon="qr-code-outline" />
                  </Campo>
                )}
                {campoAtivo('horimetro') && (
                  <Campo separator>
                    <CampoLabel texto="Horímetro / KM" />
                    <InputTexto value={horimetro} onChange={setHorimetro} placeholder="Ex: 87.500 km ou 1.200 h" icon="speedometer-outline" />
                  </Campo>
                )}
              </Secao>
            )}

            {/* ── AGENDAMENTO ── */}
            {(campoAtivo('dataAgendada') || (campoAtivo('tecnico') && tecnicos.length > 0)) && (
              <Secao titulo="Agendamento" icone="calendar-outline" cor={SECAO_CORES['Agendamento']}>
                {campoAtivo('dataAgendada') && (
                  <Campo>
                    <CampoLabel texto="Data Agendada" />
                    <InputTexto
                      value={dataAgendada}
                      onChange={(v) => setDataAgendada(formatarData(v))}
                      placeholder="DD/MM/AAAA"
                      icon="calendar-outline"
                      teclado="numeric"
                      maxLen={10}
                    />
                  </Campo>
                )}
                {campoAtivo('tecnico') && tecnicos.length > 0 && (
                  <Campo separator={campoAtivo('dataAgendada')}>
                    <CampoLabel texto="Técnico Responsável" />
                    <Seletor
                      valor={tecnicoSel?.nome ?? ''}
                      placeholder="Selecionar técnico"
                      icon="person-outline"
                      onPress={() => setModalTecnico(true)}
                      onClear={() => setTecnicoSel(null)}
                    />
                  </Campo>
                )}
              </Secao>
            )}

            {/* ── FINANCEIRO ── */}
            {(campoAtivo('valorEstimado') || campoAtivo('formaPagamento')) && (
              <Secao titulo="Financeiro" icone="cash-outline" cor={SECAO_CORES['Financeiro']}>
                {campoAtivo('valorEstimado') && (
                  <Campo>
                    <CampoLabel texto="Valor Estimado (R$)" />
                    <InputTexto value={valorEstimado} onChange={setValorEstimado} placeholder="0,00" icon="logo-usd" teclado="decimal-pad" />
                  </Campo>
                )}
                {campoAtivo('formaPagamento') && (
                  <Campo separator={campoAtivo('valorEstimado')}>
                    <CampoLabel texto="Forma de Pagamento" />
                    <Chips opcoes={FORMAS_PAG} selecionado={formaPagamento} onSelect={setFormaPagamento} cor={SECAO_CORES['Financeiro']} />
                  </Campo>
                )}
              </Secao>
            )}

            {/* ── SOLICITANTE ── */}
            {(campoAtivo('solicitante') || campoAtivo('contatoSolicitante') || campoAtivo('enderecoServico')) && (
              <Secao titulo="Solicitante" icone="person-outline" cor={SECAO_CORES['Solicitante']}>
                {campoAtivo('solicitante') && (
                  <Campo>
                    <CampoLabel texto="Nome do Solicitante" />
                    <InputTexto value={solicitante} onChange={setSolicitante} placeholder="Quem abriu o chamado" icon="person-outline" />
                  </Campo>
                )}
                {campoAtivo('contatoSolicitante') && (
                  <Campo separator={campoAtivo('solicitante')}>
                    <CampoLabel texto="Contato do Solicitante" />
                    <InputTexto value={contatoSolicitante} onChange={setContatoSolicitante} placeholder="(00) 00000-0000 ou e-mail" icon="call-outline" teclado="phone-pad" />
                  </Campo>
                )}
                {campoAtivo('enderecoServico') && (
                  <Campo separator={campoAtivo('solicitante') || campoAtivo('contatoSolicitante')}>
                    <CampoLabel texto="Endereço do Serviço" />
                    <InputTexto value={enderecoServico} onChange={setEnderecoServico} placeholder="Onde o serviço será realizado" icon="location-outline" />
                  </Campo>
                )}
              </Secao>
            )}

            {/* ── EXTRAS ── */}
            {(campoAtivo('observacoesInternas') || campoAtivo('seguro')) && (
              <Secao titulo="Extras" icone="ellipsis-horizontal-outline" cor={SECAO_CORES['Extras']}>
                {campoAtivo('observacoesInternas') && (
                  <Campo>
                    <CampoLabel texto="Observações Internas" />
                    <InputTexto value={observacoesInternas} onChange={setObservacoesInternas} placeholder="Notas internas — não aparecem no PDF" multiline />
                  </Campo>
                )}
                {campoAtivo('seguro') && (
                  <Campo separator={campoAtivo('observacoesInternas')}>
                    <CampoLabel texto="Nº do Seguro" />
                    <InputTexto value={seguro} onChange={setSeguro} placeholder="Número da apólice de seguro" icon="shield-outline" />
                  </Campo>
                )}
              </Secao>
            )}

            {/* Botão salvar */}
            <Animated.View style={{ transform: [{ scale: scaleSave }], marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.salvarBtn, { backgroundColor: tema.primario, shadowColor: tema.primario }, salvando && { opacity: 0.7 }]}
                onPress={handleSalvar}
                disabled={salvando}
                activeOpacity={0.9}
              >
                {salvando
                  ? <Text style={styles.salvarBtnTexto}>Salvando...</Text>
                  : <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.salvarBtnTexto}>{modoEdicao ? 'Salvar Alterações' : 'Salvar Ordem de Serviço'}</Text>
                    </>
                }
              </TouchableOpacity>
            </Animated.View>

          </Animated.View>
        </ScrollView>

        {/* Modal cliente */}
        <Modal visible={modalCliente} animationType="slide" transparent onRequestClose={() => setModalCliente(false)}>
          <View style={styles.modalFundo}>
            <View style={[styles.modalBox, { backgroundColor: tema.card }]}>
              <View style={[styles.modalHandle, { backgroundColor: tema.borda }]} />
              <View style={[styles.modalHeader, { borderBottomColor: tema.borda }]}>
                <Text style={[styles.modalTitulo, { color: tema.texto }]}>Selecionar Cliente</Text>
                <TouchableOpacity onPress={() => setModalCliente(false)} style={[styles.modalClose, { backgroundColor: tema.fundo }]}>
                  <Ionicons name="close" size={18} color={tema.textoMuted} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={clientes}
                keyExtractor={(i) => i.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: tema.borda }]}
                    onPress={() => { setClienteSel(item); setModalCliente(false); }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.modalItemIcone, { backgroundColor: '#16a34a20' }]}>
                      <Ionicons name="business" size={16} color="#16a34a" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalItemNome, { color: tema.texto }]}>{item.nome}</Text>
                      <Text style={[styles.modalItemSub,  { color: tema.textoMuted }]}>{item.cidade}/{item.estado}</Text>
                    </View>
                    {clienteSel?.id === item.id && <Ionicons name="checkmark-circle" size={20} color={tema.primario} />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Modal técnico */}
        <Modal visible={modalTecnico} animationType="slide" transparent onRequestClose={() => setModalTecnico(false)}>
          <View style={styles.modalFundo}>
            <View style={[styles.modalBox, { backgroundColor: tema.card }]}>
              <View style={[styles.modalHandle, { backgroundColor: tema.borda }]} />
              <View style={[styles.modalHeader, { borderBottomColor: tema.borda }]}>
                <Text style={[styles.modalTitulo, { color: tema.texto }]}>Selecionar Técnico</Text>
                <TouchableOpacity onPress={() => setModalTecnico(false)} style={[styles.modalClose, { backgroundColor: tema.fundo }]}>
                  <Ionicons name="close" size={18} color={tema.textoMuted} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={tecnicos}
                keyExtractor={(i) => i.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: tema.borda }]}
                    onPress={() => { setTecnicoSel(item); setModalTecnico(false); }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.modalItemIcone, { backgroundColor: '#9333ea20' }]}>
                      <Ionicons name="person" size={16} color="#9333ea" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalItemNome, { color: tema.texto }]}>{item.nome}</Text>
                      <Text style={[styles.modalItemSub,  { color: tema.textoMuted }]}>{item.cargo}</Text>
                    </View>
                    {tecnicoSel?.id === item.id && <Ionicons name="checkmark-circle" size={20} color="#9333ea" />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </FormCtx.Provider>
  );
}

function criarEstilos(t: AppTema) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.fundo },

    headerWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 20, paddingTop: 58, paddingBottom: 18, overflow: 'hidden',
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 12, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    titulo:    { color: t.texto,    fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
    subtitulo: { color: t.textoMuted, fontSize: 11, marginTop: 1 },
    osNumBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1,
    },
    osNumTexto: { fontSize: 11, fontWeight: '700' },

    scroll: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 4 },

    secao:       { marginBottom: 20 },
    secaoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    secaoIcone:  { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
    secaoTitulo: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
    secaoLinha:  { flex: 1, height: 1 },
    secaoCard:   { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

    campo:      { padding: 14 },
    campoLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },

    inputRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, minHeight: 46,
    },
    inputRowMultiline: { alignItems: 'flex-start', paddingVertical: 12 },
    inputTexto: { flex: 1, fontSize: 14, paddingVertical: 0 },
    inputMultiline: { minHeight: 80, paddingTop: 0 },

    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
    },
    chipTexto: { fontSize: 12 },

    seletor: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 13,
    },
    seletorTexto: { flex: 1, fontSize: 14 },

    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    switchLabel: { fontSize: 14, fontWeight: '600' },
    switchSub:   { fontSize: 11, marginTop: 2 },

    alertaCliente: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: 12, borderWidth: 1, padding: 13,
    },
    alertaClienteTexto: { color: '#d97706', fontSize: 13, flex: 1 },

    salvarBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      borderRadius: 16, paddingVertical: 17, marginBottom: 8,
      shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 5,
    },
    salvarBtnTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },

    modalFundo: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
    modalBox:   { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '72%', paddingBottom: 32 },
    modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginVertical: 14 },
    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
    },
    modalTitulo: { fontSize: 16, fontWeight: '700' },
    modalClose:  { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    modalItem:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
    modalItemIcone: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    modalItemNome:  { fontSize: 14, fontWeight: '600' },
    modalItemSub:   { fontSize: 12, marginTop: 2 },
  });
}
