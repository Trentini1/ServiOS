export type AppTema = {
  id: string;
  nome: string;
  descricao: string;
  emoji: string;
  fundo: string;
  card: string;
  borda: string;
  primario: string;
  texto: string;
  textoSec: string;
  textoMuted: string;
  textoFraco: string;
  inputFundo: string;
};

export type PdfTema = {
  id: string;
  nome: string;
  descricao: string;
  corHeader: string;
  corAcento: string;
  corTextoHeader: string;
  corSecao: string;
  estiloTabela: 'moderno' | 'listrado' | 'minimal' | 'elegante' | 'industrial';
};

export const TEMAS_PRESET: AppTema[] = [
  {
    id: 'navy',
    nome: 'Azul Naval',
    descricao: 'O tema padrão. Fundo azul-marinho com azul primário.',
    emoji: '🌑',
    fundo: '#0b1220',
    card: '#111827',
    borda: '#1f2937',
    primario: '#2563eb',
    texto: '#ffffff',
    textoSec: '#94a3b8',
    textoMuted: '#64748b',
    textoFraco: '#475569',
    inputFundo: '#0b1220',
  },
  {
    id: 'obsidian',
    nome: 'Obsidiana',
    descricao: 'Preto absoluto com acentos índigo. Máximo contraste.',
    emoji: '⬛',
    fundo: '#000000',
    card: '#0d0d0d',
    borda: '#1c1c1e',
    primario: '#6366f1',
    texto: '#ffffff',
    textoSec: '#a1a1aa',
    textoMuted: '#71717a',
    textoFraco: '#52525b',
    inputFundo: '#050505',
  },
  {
    id: 'forest',
    nome: 'Floresta',
    descricao: 'Verde profundo com acentos esmeralda. Natureza e tecnologia.',
    emoji: '🌿',
    fundo: '#071210',
    card: '#0d2018',
    borda: '#163d28',
    primario: '#10b981',
    texto: '#ffffff',
    textoSec: '#86efac',
    textoMuted: '#4ade80',
    textoFraco: '#166534',
    inputFundo: '#071210',
  },
  {
    id: 'carbon',
    nome: 'Carvão',
    descricao: 'Cinza escuro com acentos âmbar. Industrial e elegante.',
    emoji: '🔥',
    fundo: '#111111',
    card: '#1c1c1c',
    borda: '#2c2c2c',
    primario: '#f59e0b',
    texto: '#ffffff',
    textoSec: '#a3a3a3',
    textoMuted: '#737373',
    textoFraco: '#525252',
    inputFundo: '#111111',
  },
  {
    id: 'ocean',
    nome: 'Oceano',
    descricao: 'Azul profundo com acentos ciano. Calmo e profissional.',
    emoji: '🌊',
    fundo: '#00111f',
    card: '#001a2e',
    borda: '#00304d',
    primario: '#06b6d4',
    texto: '#ffffff',
    textoSec: '#67e8f9',
    textoMuted: '#22d3ee',
    textoFraco: '#164e63',
    inputFundo: '#00111f',
  },
];

export const PDF_TEMAS_PRESET: PdfTema[] = [
  {
    id: 'corporativo',
    nome: 'Azul Corporativo',
    descricao: 'Profissional com cabeçalho azul e linhas de acento.',
    corHeader: '#2563eb',
    corAcento: '#1d4ed8',
    corTextoHeader: '#ffffff',
    corSecao: '#2563eb',
    estiloTabela: 'moderno',
  },
  {
    id: 'verde',
    nome: 'Verde Profissional',
    descricao: 'Transmite confiança com verde escuro e toques de esmeralda.',
    corHeader: '#16a34a',
    corAcento: '#15803d',
    corTextoHeader: '#ffffff',
    corSecao: '#16a34a',
    estiloTabela: 'listrado',
  },
  {
    id: 'executivo',
    nome: 'Cinza Executivo',
    descricao: 'Minimalista e sóbrio. Ideal para documentos formais.',
    corHeader: '#1e293b',
    corAcento: '#475569',
    corTextoHeader: '#ffffff',
    corSecao: '#334155',
    estiloTabela: 'minimal',
  },
  {
    id: 'elegante',
    nome: 'Preto Elegante',
    descricao: 'Cabeçalho preto com detalhes dourados. Alta distinção.',
    corHeader: '#0f172a',
    corAcento: '#c9a227',
    corTextoHeader: '#c9a227',
    corSecao: '#c9a227',
    estiloTabela: 'elegante',
  },
  {
    id: 'industrial',
    nome: 'Âmbar Industrial',
    descricao: 'Visualmente marcante com âmbar e tons terrosos.',
    corHeader: '#92400e',
    corAcento: '#d97706',
    corTextoHeader: '#ffffff',
    corSecao: '#b45309',
    estiloTabela: 'industrial',
  },
];

export const TEMA_PADRAO = TEMAS_PRESET[0];
export const PDF_TEMA_PADRAO = PDF_TEMAS_PRESET[0];

// Cores sugeridas para o color picker de app
export const CORES_FUNDO = [
  '#000000', '#050505', '#0a0a0a', '#0d0d0d',
  '#0b1220', '#0f172a', '#111827', '#1e293b',
  '#071210', '#0d2018', '#163d28', '#0a1a0d',
  '#00111f', '#001a2e', '#00304d', '#002244',
  '#0a0714', '#130c25', '#1e1040', '#100010',
  '#111111', '#1a1a1a', '#1c1c1c', '#2a2a2a',
];

export const CORES_PRIMARIO = [
  '#2563eb', '#3b82f6', '#1d4ed8', '#60a5fa',
  '#6366f1', '#8b5cf6', '#7c3aed', '#a78bfa',
  '#10b981', '#16a34a', '#22c55e', '#4ade80',
  '#06b6d4', '#0891b2', '#22d3ee', '#0e7490',
  '#f59e0b', '#d97706', '#fbbf24', '#b45309',
  '#ef4444', '#dc2626', '#f87171', '#b91c1c',
  '#ec4899', '#db2777', '#f9a8d4', '#be185d',
  '#c9a227', '#e5c100', '#ffd700', '#a87c00',
];
