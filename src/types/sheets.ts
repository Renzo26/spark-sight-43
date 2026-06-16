// Tipos centrais para as abas do Google Sheets.
export type ISODate = string; // AAAA-MM-DD

export interface SomatorioRow {
  data: ISODate;
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  leads: number;
}

export interface FacebookAdsRow {
  data: ISODate;
  campanha: string;
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  leads: number;
}

export interface GoogleAdsRow {
  data: ISODate;
  campanha: string;
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  leads: number;
}

export interface CriativoRow {
  data: ISODate;
  criativo: string;
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  leads: number;
  /** URL do preview do criativo (imagem/thumb). Opcional — vem da planilha quando disponível. */
  previewUrl?: string;
}

export interface PublicoRow {
  data: ISODate;
  publico: string;
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  leads: number;
}

export interface PublicoQFRow {
  data: ISODate;
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  leads: number;
}

export type FaseFunil =
  | "Distribuição"
  | "Captação"
  | "Aquecimento"
  | "Lembrete"
  | "Evento"
  | "Carrinho";

export interface FaseRow {
  data: ISODate;
  fase: FaseFunil;
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  leads?: number;
}

export interface GA4Row {
  data: ISODate;
  sessoes: number;
  usuarios: number;
  novosUsuarios: number;
}

export interface GrupoWhatsRow {
  grupo: string;
  leads: number;
}

/**
 * Funil de ações de conversão (informação não nativa — vem de eventos do
 * pixel/GA4 ou da plataforma de e-commerce). Valores por dia.
 */
export interface ConversaoRow {
  data: ISODate;
  addToCart: number; // Adicionar ao carrinho
  initiateCheckout: number; // Iniciar checkout
  purchase: number; // Compras (vendas)
  thankYouPage: number; // Acessos à página de obrigado
  faturamento: number; // Receita gerada (BRL)
}

/**
 * Connect Rate por etapa de página. Compara cliques no anúncio com as sessões
 * que efetivamente chegam à Home e às landing pages posteriores.
 */
export interface ConnectRateRow {
  data: ISODate;
  cliques: number; // cliques no anúncio
  homeSessoes: number; // sessões que chegaram à Home Page
  landingSessoes: number; // sessões que avançaram para landing pages posteriores
}

/** Linha de meta para gráficos de metas (realizado × Ideal × Máximo). */
export interface MetaRow {
  metrica: string;
  realizado: number;
  ideal: number;
  maximo: number;
  formato: "int" | "brl";
}

export interface SheetsData {
  somatorio: SomatorioRow[];
  facebookAds: FacebookAdsRow[];
  googleAds: GoogleAdsRow[];
  fbCriativos: CriativoRow[];
  fbPublicos: PublicoRow[];
  publicoQ: PublicoQFRow[];
  publicoF: PublicoQFRow[];
  fases: FaseRow[];
  ga4: GA4Row[];
  gruposWhats: GrupoWhatsRow[];
  conversoes: ConversaoRow[];
  connectRate: ConnectRateRow[];
  metas: MetaRow[];
  ultimaAtualizacao: string; // ISO
}

export interface DashboardFilters {
  dataInicio: ISODate;
  dataFim: ISODate;
}
