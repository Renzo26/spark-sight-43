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
  cliques: number;
  leads: number;
}

export interface CriativoRow {
  data: ISODate;
  criativo: string;
  investimento: number;
  leads: number;
}

export interface PublicoRow {
  data: ISODate;
  publico: string;
  investimento: number;
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
  ultimaAtualizacao: string; // ISO
}

export type Plataforma = "Todas" | "Facebook Ads" | "Google Ads";
export type FasePublicoFiltro = "Todos" | "Quente" | "Frio";
export type FaseFiltro = "Todas" | FaseFunil;

export interface DashboardFilters {
  dataInicio: ISODate;
  dataFim: ISODate;
  plataforma: Plataforma;
  fase: FaseFiltro;
  publico: FasePublicoFiltro;
}
