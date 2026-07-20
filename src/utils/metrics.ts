import type {
  DashboardFilters,
  FacebookAdsRow,
  FaseRow,
  GoogleAdsRow,
  ISODate,
  SheetsData,
  SomatorioRow,
} from "@/types/sheets";

// ---------- Descrições das métricas (sigla → nome completo) ----------
export const METRIC_DESC: Record<string, string> = {
  CPC: "Custo por Clique",
  CPM: "Custo por Mil Impressões",
  CPL: "Custo por Lead",
  CPA: "Custo por Aquisição",
  CTR: "Taxa de Cliques",
  ROAS: "Retorno sobre o Investimento",
  Frequência: "Média de vezes que cada pessoa viu o anúncio",
  "Connect Rate": "Sessões geradas a cada clique",
  "Custo / Sessão": "Custo por Sessão",
  Impressões: "Total de exibições do anúncio",
  Alcance: "Pessoas únicas atingidas",
  Cliques: "Cliques no anúncio",
  Leads: "Cadastros gerados",
  Vendas: "Compras concluídas",
  Faturamento: "Receita gerada",
};

/** Retorna `SIGLA (Descrição)` quando há descrição cadastrada; senão só a sigla. */
export const metricLabel = (sigla: string): string =>
  METRIC_DESC[sigla] ? `${sigla} (${METRIC_DESC[sigla]})` : sigla;

// ---------- Formatação ----------
export const fmtBRL = (v: number | null | undefined): string => {
  if (v == null || !isFinite(v)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(v);
};

export const fmtInt = (v: number | null | undefined): string => {
  if (v == null || !isFinite(v)) return "—";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(v);
};

export const fmtPct = (v: number | null | undefined): string => {
  if (v == null || !isFinite(v)) return "—";
  return `${v.toFixed(2).replace(".", ",")}%`;
};

export const fmtNum = (v: number | null | undefined, digits = 2): string => {
  if (v == null || !isFinite(v)) return "—";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits }).format(v);
};

export const fmtData = (iso: ISODate): string => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
};

// ---------- Helpers ----------
const inRange = (d: ISODate, ini: ISODate, fim: ISODate) => d >= ini && d <= fim;

const safeDiv = (n: number, d: number): number | null => (d > 0 && isFinite(n / d) ? n / d : null);

// ---------- Dados filtrados ----------
export interface FilteredData {
  somatorio: SomatorioRow[];
  facebookAds: FacebookAdsRow[];
  googleAds: GoogleAdsRow[];
  fases: FaseRow[];
}

export function applyFilters(data: SheetsData, f: DashboardFilters): FilteredData {
  const fb = data.facebookAds.filter((r) => inRange(r.data, f.dataInicio, f.dataFim));
  const gg = data.googleAds.filter((r) => inRange(r.data, f.dataInicio, f.dataFim));
  const fases = data.fases.filter((r) => inRange(r.data, f.dataInicio, f.dataFim));

  // Somatório recalculado a partir de Facebook + Google (sem filtro de plataforma).
  const byDate = new Map<ISODate, SomatorioRow>();
  const upsert = (r: {
    data: ISODate;
    investimento: number;
    impressoes: number;
    alcance?: number;
    cliques: number;
    leads: number;
    sessoes?: number;
  }) => {
    const cur = byDate.get(r.data) ?? {
      data: r.data,
      investimento: 0,
      impressoes: 0,
      alcance: 0,
      cliques: 0,
      leads: 0,
      sessoes: 0,
    };
    cur.investimento += r.investimento;
    cur.impressoes += r.impressoes;
    cur.alcance += r.alcance ?? 0;
    cur.cliques += r.cliques;
    cur.leads += r.leads;
    cur.sessoes += r.sessoes ?? 0;
    byDate.set(r.data, cur);
  };
  fb.forEach(upsert);
  gg.forEach(upsert);

  const somatorio = Array.from(byDate.values()).sort((a, b) => a.data.localeCompare(b.data));

  return { somatorio, facebookAds: fb, googleAds: gg, fases };
}

// ---------- KPIs ----------
export interface KpiTotais {
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  leads: number;
  cpm: number | null;
  ctr: number | null;
  cpc: number | null;
  cpl: number | null;
  frequencia: number | null;
  // Sessões/GA4
  sessoes: number;
  usuarios: number;
  custoPorSessao: number | null;
  connectRate: number | null;
  // E-commerce / conversão
  addToCart: number;
  checkout: number;
  compras: number; // vendas
  thankYouPage: number;
  custoPorCheckout: number | null;
  cpa: number | null;
  faturamento: number;
  ticketMedio: number | null;
  roas: number | null;
}

export function computeKpis(
  filtered: FilteredData,
  ga4: SheetsData["ga4"],
  conversoes: SheetsData["conversoes"],
  f: DashboardFilters,
): KpiTotais {
  const ga = ga4.filter((r) => inRange(r.data, f.dataInicio, f.dataFim));
  const conv = conversoes.filter((r) => inRange(r.data, f.dataInicio, f.dataFim));

  const investimento = filtered.somatorio.reduce((s, r) => s + r.investimento, 0);
  const impressoes = filtered.somatorio.reduce((s, r) => s + r.impressoes, 0);
  const alcance = filtered.somatorio.reduce((s, r) => s + r.alcance, 0);
  const cliques = filtered.somatorio.reduce((s, r) => s + r.cliques, 0);
  const leads = filtered.somatorio.reduce((s, r) => s + r.leads, 0);
  // "Sessões" usa Landing Page View do Meta (única fonte disponível hoje —
  // não há GA4 conectado). `usuarios` continua vindo do GA4 real (ainda vazio).
  const sessoes = filtered.somatorio.reduce((s, r) => s + r.sessoes, 0);
  const usuarios = ga.reduce((s, r) => s + r.usuarios, 0);

  const addToCart = conv.reduce((s, r) => s + r.addToCart, 0);
  const checkout = conv.reduce((s, r) => s + r.initiateCheckout, 0);
  const compras = conv.reduce((s, r) => s + r.purchase, 0);
  const thankYouPage = conv.reduce((s, r) => s + r.thankYouPage, 0);
  const faturamento = conv.reduce((s, r) => s + r.faturamento, 0);

  const cpm = safeDiv(investimento, impressoes);
  return {
    investimento,
    impressoes,
    alcance,
    cliques,
    leads,
    cpm: cpm != null ? cpm * 1000 : null,
    ctr: safeDiv(cliques, impressoes) != null ? (cliques / impressoes) * 100 : null,
    cpc: safeDiv(investimento, cliques),
    cpl: safeDiv(investimento, leads),
    frequencia: safeDiv(impressoes, alcance),
    sessoes,
    usuarios,
    custoPorSessao: safeDiv(investimento, sessoes),
    connectRate: safeDiv(sessoes, cliques) != null ? (sessoes / cliques) * 100 : null,
    addToCart,
    checkout,
    compras,
    thankYouPage,
    custoPorCheckout: safeDiv(investimento, checkout),
    cpa: safeDiv(investimento, compras),
    faturamento,
    ticketMedio: safeDiv(faturamento, compras),
    roas: safeDiv(faturamento, investimento),
  };
}

// ---------- Série temporal (sparkline + gráfico principal) ----------
export interface SerieDia {
  data: ISODate;
  label: string;
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  leads: number;
}

export function serieTemporal(filtered: FilteredData): SerieDia[] {
  return filtered.somatorio.map((r) => ({
    data: r.data,
    label: fmtData(r.data),
    investimento: r.investimento,
    impressoes: r.impressoes,
    alcance: r.alcance,
    cliques: r.cliques,
    leads: r.leads,
  }));
}

// ---------- Comparativo por plataforma (série temporal) ----------
export interface SeriePlataformaDia {
  data: ISODate;
  label: string;
  facebookInv: number;
  googleInv: number;
  totalInv: number;
  facebookLeads: number;
  googleLeads: number;
  totalLeads: number;
}

export function serieInvestimentoPlataforma(filtered: FilteredData): SeriePlataformaDia[] {
  const map = new Map<ISODate, { fbI: number; ggI: number; fbL: number; ggL: number }>();
  const get = (d: ISODate) => {
    const cur = map.get(d) ?? { fbI: 0, ggI: 0, fbL: 0, ggL: 0 };
    map.set(d, cur);
    return cur;
  };
  for (const r of filtered.facebookAds) {
    const c = get(r.data);
    c.fbI += r.investimento;
    c.fbL += r.leads;
  }
  for (const r of filtered.googleAds) {
    const c = get(r.data);
    c.ggI += r.investimento;
    c.ggL += r.leads;
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([data, v]) => ({
      data,
      label: fmtData(data),
      facebookInv: v.fbI,
      googleInv: v.ggI,
      totalInv: v.fbI + v.ggI,
      facebookLeads: v.fbL,
      googleLeads: v.ggL,
      totalLeads: v.fbL + v.ggL,
    }));
}

export interface TotaisPlataforma {
  facebookInv: number;
  googleInv: number;
  totalInv: number;
  facebookLeads: number;
  googleLeads: number;
  totalLeads: number;
}

export function totaisPlataforma(filtered: FilteredData): TotaisPlataforma {
  const fbI = filtered.facebookAds.reduce((s, r) => s + r.investimento, 0);
  const ggI = filtered.googleAds.reduce((s, r) => s + r.investimento, 0);
  const fbL = filtered.facebookAds.reduce((s, r) => s + r.leads, 0);
  const ggL = filtered.googleAds.reduce((s, r) => s + r.leads, 0);
  return {
    facebookInv: fbI,
    googleInv: ggI,
    totalInv: fbI + ggI,
    facebookLeads: fbL,
    googleLeads: ggL,
    totalLeads: fbL + ggL,
  };
}

// ---------- Agregações ----------
/** Métricas derivadas comuns a todas as dimensões de detalhamento. */
function derivadas(c: {
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  leads: number;
}) {
  return {
    cpl: safeDiv(c.investimento, c.leads),
    cpc: safeDiv(c.investimento, c.cliques),
    cpm:
      safeDiv(c.investimento, c.impressoes) != null ? (c.investimento / c.impressoes) * 1000 : null,
    ctr: safeDiv(c.cliques, c.impressoes) != null ? (c.cliques / c.impressoes) * 100 : null,
    frequencia: safeDiv(c.impressoes, c.alcance),
  };
}

export interface CampanhaAgg {
  campanha: string;
  plataforma: "Facebook Ads" | "Google Ads";
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  leads: number;
  cpl: number | null;
  cpc: number | null;
  cpm: number | null;
  ctr: number | null;
  frequencia: number | null;
}

export function aggCampanhas(filtered: FilteredData): CampanhaAgg[] {
  const map = new Map<string, CampanhaAgg>();
  const upsert = (
    key: string,
    plat: CampanhaAgg["plataforma"],
    row: {
      investimento: number;
      impressoes: number;
      alcance: number;
      cliques: number;
      leads: number;
    },
  ) => {
    const k = `${plat}::${key}`;
    const cur = map.get(k) ?? {
      campanha: key,
      plataforma: plat,
      investimento: 0,
      impressoes: 0,
      alcance: 0,
      cliques: 0,
      leads: 0,
      cpl: null,
      cpc: null,
      cpm: null,
      ctr: null,
      frequencia: null,
    };
    cur.investimento += row.investimento;
    cur.impressoes += row.impressoes;
    cur.alcance += row.alcance;
    cur.cliques += row.cliques;
    cur.leads += row.leads;
    map.set(k, cur);
  };
  filtered.facebookAds.forEach((r) => upsert(r.campanha, "Facebook Ads", r));
  filtered.googleAds.forEach((r) => upsert(r.campanha, "Google Ads", r));
  return Array.from(map.values()).map((c) => ({ ...c, ...derivadas(c) }));
}

export interface CriativoAgg {
  criativo: string;
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  leads: number;
  cpl: number | null;
  cpc: number | null;
  cpm: number | null;
  ctr: number | null;
  frequencia: number | null;
  previewUrl?: string;
}
export function aggCriativos(rows: SheetsData["fbCriativos"], f: DashboardFilters): CriativoAgg[] {
  const map = new Map<string, CriativoAgg>();
  for (const r of rows) {
    if (!inRange(r.data, f.dataInicio, f.dataFim)) continue;
    const cur = map.get(r.criativo) ?? {
      criativo: r.criativo,
      investimento: 0,
      impressoes: 0,
      alcance: 0,
      cliques: 0,
      leads: 0,
      cpl: null,
      cpc: null,
      cpm: null,
      ctr: null,
      frequencia: null,
      previewUrl: r.previewUrl,
    };
    cur.investimento += r.investimento;
    cur.impressoes += r.impressoes;
    cur.alcance += r.alcance;
    cur.cliques += r.cliques;
    cur.leads += r.leads;
    if (!cur.previewUrl && r.previewUrl) cur.previewUrl = r.previewUrl;
    map.set(r.criativo, cur);
  }
  return Array.from(map.values()).map((c) => ({ ...c, ...derivadas(c) }));
}

export interface PublicoAgg {
  publico: string;
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  leads: number;
  cpl: number | null;
  cpc: number | null;
  cpm: number | null;
  ctr: number | null;
  frequencia: number | null;
}
export function aggPublicos(rows: SheetsData["fbPublicos"], f: DashboardFilters): PublicoAgg[] {
  const map = new Map<string, PublicoAgg>();
  for (const r of rows) {
    if (!inRange(r.data, f.dataInicio, f.dataFim)) continue;
    const cur = map.get(r.publico) ?? {
      publico: r.publico,
      investimento: 0,
      impressoes: 0,
      alcance: 0,
      cliques: 0,
      leads: 0,
      cpl: null,
      cpc: null,
      cpm: null,
      ctr: null,
      frequencia: null,
    };
    cur.investimento += r.investimento;
    cur.impressoes += r.impressoes;
    cur.alcance += r.alcance;
    cur.cliques += r.cliques;
    cur.leads += r.leads;
    map.set(r.publico, cur);
  }
  return Array.from(map.values()).map((c) => ({ ...c, ...derivadas(c) }));
}

export interface FaseAgg {
  fase: string;
  investimento: number;
  leads: number;
}
export function aggFases(filtered: FilteredData): FaseAgg[] {
  const map = new Map<string, FaseAgg>();
  for (const r of filtered.fases) {
    const cur = map.get(r.fase) ?? { fase: r.fase, investimento: 0, leads: 0 };
    cur.investimento += r.investimento;
    cur.leads += r.leads ?? 0;
    map.set(r.fase, cur);
  }
  const ORDEM = ["Distribuição", "Captação", "Aquecimento", "Lembrete", "Evento", "Carrinho"];
  return Array.from(map.values()).sort((a, b) => ORDEM.indexOf(a.fase) - ORDEM.indexOf(b.fase));
}

export function aggPlataformaInvestimento(filtered: FilteredData): {
  plataforma: string;
  investimento: number;
}[] {
  const fb = filtered.facebookAds.reduce((s, r) => s + r.investimento, 0);
  const gg = filtered.googleAds.reduce((s, r) => s + r.investimento, 0);
  return [
    { plataforma: "Facebook Ads", investimento: fb },
    { plataforma: "Google Ads", investimento: gg },
  ].filter((p) => p.investimento > 0);
}

export interface QFAgg {
  tipo: "Quente" | "Frio";
  investimento: number;
  leads: number;
  cpl: number | null;
}
export function aggQF(data: SheetsData, f: DashboardFilters): QFAgg[] {
  const tot = (rows: SheetsData["publicoQ"]) => {
    const filt = rows.filter((r) => inRange(r.data, f.dataInicio, f.dataFim));
    const inv = filt.reduce((s, r) => s + r.investimento, 0);
    const ld = filt.reduce((s, r) => s + r.leads, 0);
    return { inv, ld };
  };
  const q = tot(data.publicoQ);
  const fr = tot(data.publicoF);
  return [
    { tipo: "Quente", investimento: q.inv, leads: q.ld, cpl: safeDiv(q.inv, q.ld) },
    { tipo: "Frio", investimento: fr.inv, leads: fr.ld, cpl: safeDiv(fr.inv, fr.ld) },
  ];
}

// ---------- Funil de ações de conversão ----------
export interface ConversaoTotais {
  addToCart: number;
  initiateCheckout: number;
  purchase: number;
  thankYouPage: number;
  faturamento: number;
}
export function aggConversoes(
  rows: SheetsData["conversoes"],
  f: DashboardFilters,
): ConversaoTotais {
  const filt = rows.filter((r) => inRange(r.data, f.dataInicio, f.dataFim));
  return {
    addToCart: filt.reduce((s, r) => s + r.addToCart, 0),
    initiateCheckout: filt.reduce((s, r) => s + r.initiateCheckout, 0),
    purchase: filt.reduce((s, r) => s + r.purchase, 0),
    thankYouPage: filt.reduce((s, r) => s + r.thankYouPage, 0),
    faturamento: filt.reduce((s, r) => s + r.faturamento, 0),
  };
}

export interface SerieConversaoDia {
  data: ISODate;
  label: string;
  addToCart: number;
  initiateCheckout: number;
  purchase: number;
  thankYouPage: number;
}
export function serieConversao(
  rows: SheetsData["conversoes"],
  f: DashboardFilters,
): SerieConversaoDia[] {
  return rows
    .filter((r) => inRange(r.data, f.dataInicio, f.dataFim))
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((r) => ({
      data: r.data,
      label: fmtData(r.data),
      addToCart: r.addToCart,
      initiateCheckout: r.initiateCheckout,
      purchase: r.purchase,
      thankYouPage: r.thankYouPage,
    }));
}

// ---------- Connect Rate (Home Page × Landing pages posteriores) ----------
export interface ConnectRateTotais {
  cliques: number;
  homeSessoes: number;
  landingSessoes: number;
  homeRate: number | null; // % cliques que chegaram à Home
  landingRate: number | null; // % da Home que avançou para landing posteriores
}
export function aggConnectRate(
  rows: SheetsData["connectRate"],
  f: DashboardFilters,
): ConnectRateTotais {
  const filt = rows.filter((r) => inRange(r.data, f.dataInicio, f.dataFim));
  const cliques = filt.reduce((s, r) => s + r.cliques, 0);
  const homeSessoes = filt.reduce((s, r) => s + r.homeSessoes, 0);
  const landingSessoes = filt.reduce((s, r) => s + r.landingSessoes, 0);
  return {
    cliques,
    homeSessoes,
    landingSessoes,
    homeRate: safeDiv(homeSessoes, cliques) != null ? (homeSessoes / cliques) * 100 : null,
    // landingSessoes é sempre 0 hoje (a planilha não tem uma 2ª etapa de
    // sessão) — tratamos como "sem dado" em vez de uma taxa de 0% enganosa.
    landingRate:
      landingSessoes > 0 && safeDiv(landingSessoes, homeSessoes) != null
        ? (landingSessoes / homeSessoes) * 100
        : null,
  };
}

export interface SerieConnectRateDia {
  data: ISODate;
  label: string;
  homeRate: number | null;
  landingRate: number | null;
}
export function serieConnectRate(
  rows: SheetsData["connectRate"],
  f: DashboardFilters,
): SerieConnectRateDia[] {
  return rows
    .filter((r) => inRange(r.data, f.dataInicio, f.dataFim))
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((r) => ({
      data: r.data,
      label: fmtData(r.data),
      homeRate:
        safeDiv(r.homeSessoes, r.cliques) != null ? (r.homeSessoes / r.cliques) * 100 : null,
      landingRate:
        r.landingSessoes > 0 && safeDiv(r.landingSessoes, r.homeSessoes) != null
          ? (r.landingSessoes / r.homeSessoes) * 100
          : null,
    }));
}

// ---------- Datas iniciais ----------
export function defaultDateRange(data: SheetsData): { ini: ISODate; fim: ISODate } {
  if (data.somatorio.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    return { ini: today, fim: today };
  }
  return {
    ini: data.somatorio[0].data,
    fim: data.somatorio[data.somatorio.length - 1].data,
  };
}
