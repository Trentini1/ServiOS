export type CampoConfig = {
  id: string;
  label: string;
  descricao: string;
  secao: string;
  ativo: boolean;
  obrigatorio?: boolean; // nunca pode ser desativado
};

export const CAMPOS_PADRAO: CampoConfig[] = [
  // ── Serviço ──
  { id: 'posicao',          label: 'Posição',               descricao: 'BB, BE, Vante, Ré ou Outro',                  secao: 'Serviço',     ativo: true  },
  { id: 'descricao',        label: 'Descrição do Serviço',  descricao: 'Texto livre com o que será executado',         secao: 'Serviço',     ativo: true  },
  { id: 'prioridade',       label: 'Prioridade',            descricao: 'Baixa, Normal, Alta ou Urgente',               secao: 'Serviço',     ativo: false },
  { id: 'garantia',         label: 'Garantia',              descricao: 'Se o serviço está coberto por garantia',        secao: 'Serviço',     ativo: false },
  { id: 'tempoEstimado',    label: 'Tempo Estimado',        descricao: 'Duração prevista (ex: 2h, 3 dias)',             secao: 'Serviço',     ativo: false },
  { id: 'numeroOS',         label: 'Número da OS',          descricao: 'Código personalizado da ordem de serviço',      secao: 'Serviço',     ativo: false },

  // ── Equipamento ──
  { id: 'modelo',           label: 'Modelo',                descricao: 'Modelo do veículo ou equipamento',              secao: 'Equipamento', ativo: false },
  { id: 'ano',              label: 'Ano',                   descricao: 'Ano de fabricação',                            secao: 'Equipamento', ativo: false },
  { id: 'placa',            label: 'Placa / Nº de Série',  descricao: 'Placa do veículo ou número de série',           secao: 'Equipamento', ativo: false },
  { id: 'horimetro',        label: 'Horímetro / KM',        descricao: 'Horas de uso ou quilometragem atual',           secao: 'Equipamento', ativo: false },

  // ── Agendamento ──
  { id: 'dataAgendada',     label: 'Data Agendada',         descricao: 'Data prevista para execução do serviço',        secao: 'Agendamento', ativo: true  },
  { id: 'tecnico',          label: 'Técnico Responsável',   descricao: 'Técnico designado para executar a OS',          secao: 'Agendamento', ativo: true  },

  // ── Financeiro ──
  { id: 'valorEstimado',    label: 'Valor Estimado (R$)',   descricao: 'Orçamento inicial do serviço',                  secao: 'Financeiro',  ativo: false },
  { id: 'formaPagamento',   label: 'Forma de Pagamento',    descricao: 'PIX, Cartão, Boleto, Dinheiro...',              secao: 'Financeiro',  ativo: false },

  // ── Solicitante ──
  { id: 'solicitante',      label: 'Solicitante',           descricao: 'Nome de quem abriu o chamado',                  secao: 'Solicitante', ativo: false },
  { id: 'contatoSolicitante', label: 'Contato do Solicitante', descricao: 'Telefone ou e-mail do solicitante',          secao: 'Solicitante', ativo: false },
  { id: 'enderecoServico',  label: 'Endereço do Serviço',   descricao: 'Local onde o serviço será realizado',           secao: 'Solicitante', ativo: false },

  // ── Extras ──
  { id: 'observacoesInternas', label: 'Observações Internas', descricao: 'Notas internas, não aparecem no PDF',         secao: 'Extras',      ativo: false },
  { id: 'tipoVeiculo',      label: 'Tipo de Veículo',       descricao: 'Barco, Caminhão, Automóvel, Máquina...',        secao: 'Extras',      ativo: false },
  { id: 'seguro',           label: 'Nº do Seguro',          descricao: 'Número da apólice de seguro vinculada',          secao: 'Extras',      ativo: false },
];

export const SECAO_ICONES: Record<string, string> = {
  'Serviço':     'construct-outline',
  'Equipamento': 'cog-outline',
  'Agendamento': 'calendar-outline',
  'Financeiro':  'cash-outline',
  'Solicitante': 'person-outline',
  'Extras':      'ellipsis-horizontal-outline',
};

export const SECAO_CORES: Record<string, string> = {
  'Serviço':     '#2563eb',
  'Equipamento': '#0891b2',
  'Agendamento': '#d97706',
  'Financeiro':  '#16a34a',
  'Solicitante': '#9333ea',
  'Extras':      '#64748b',
};
