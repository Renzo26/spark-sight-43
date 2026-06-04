import type {
  DashboardFilters,
  FacebookAdsRow,
  FaseRow,
  GoogleAdsRow,
  ISODate,
  SheetsData,
  SomatorioRow,
} from "@/types/sheets";

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

const safeDiv = (n: number, d: number): number | null =>
  d > 0 && isFinite(n / d) ? n / d : null;

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
  const fases = data.fases.filter(
    (r) =>
      inRange(r.data, f.dataInicio, f.dataFim) &&
      (f.fase === "Todas" || r.fase === f.fase),
  );

  // Recalcula somatório a partir das plataformas filtradas para refletir filtro de Plataforma.
  const usaFb = f.plataforma === "Todas" || f.plataforma === "Facebook Ads";
  const usaGg = f.plataforma === "Todas" || f.plataforma === "Google Ads";

  const byDate = new Map<ISODate, SomatorioRow>();
  if (usaFb) {
    for (const r of fb) {
      const cur = byDate.get(r.data) ?? {
        data: r.data,
        investimento: 0,
        impressoes: 0,
        alcance: 0,
        cliques: 0,
        leads: 0,
      };
      cur.investimento += r.investimento;
      cur.impressoes += r.impressoes;
      cur.alcance += r.alcance;
      cur.cliques += r.cliques;
      cur.leads += r.leads;
      byDate.set(r.data, cur);
    }
  }
  if (usaGg) {
    for (const r of gg) {
      const cur = byDate.get(r.data) ?? {
        data: r.data,
        investimento: 0,
        impressoes: 0,
        alcance: 0,
        cliques: 0,
        leads: 0,
      };
      cur.investimento += r.investimento;
      cur.impressoes += r.impressoes;
      cur.cliques += r.cliques;
      cur.leads += r.leads;
      byDate.set(r.data, cur);
    }
  }

  const somatorio = Array.from(byDate.values()).sort((a, b) => a.data.localeCompare(b.data));

  return {
    somatorio,
    facebookAds: usaFb ? fb : [],
    googleAds: usaGg ? gg : [],
    fases,
  };
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
  // E-commerce (placeholders)
  visualizacoesPagina: number | null;
  checkout: number | null;
  custoPorCheckout: number | null;
  compras: number | null;
  cpa: number | null;
  faturamento: number | null;
  roas: number | null;
}

export function computeKpis(
  filtered: FilteredData,
  ga4: SheetsData["ga4"],
  f: DashboardFilters,
): KpiTotais {
  const ga = ga4.filter((r) => inRange(r.data, f.dataInicio, f.dataFim));

  const investimento = filtered.somatorio.reduce((s, r) => s + r.investimento, 0);
  const impressoes = filtered.somatorio.reduce((s, r) => s + r.impressoes, 0);
  const alcance = filtered.somatorio.reduce((s, r) => s + r.alcance, 0);
  const cliques = filtered.somatorio.reduce((s, r) => s + r.cliques, 0);
  const leads = filtered.somatorio.reduce((s, r) => s + r.leads, 0);
  const sessoes = ga.reduce((s, r) => s + r.sessoes, 0);
  const usuarios = ga.reduce((s, r) => s + r.usuarios, 0);

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
    visualizacoesPagina: null,
    checkout: null,
    custoPorCheckout: null,
    compras: null,
    cpa: null,
    faturamento: null,
    roas: null,
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

// ---------- Agregações ----------
export interface CampanhaAgg {
  campanha: string;
  plataforma: "Facebook Ads" | "Google Ads";
  investimento: number;
  impressoes: number;
  cliques: number;
  leads: number;
  cpl: number | null;
  ctr: number | null;
}

export function aggCampanhas(filtered: FilteredData): CampanhaAgg[] {
  const map = new Map<string, CampanhaAgg>();
  const upsert = (key: string, plat: CampanhaAgg["plataforma"], row: {
    investimento: number; impressoes: number; cliques: number; leads: number;
  }) => {
    const k = `${plat}::${key}`;
    const cur = map.get(k) ?? {
      campanha: key, plataforma: plat,
      investimento: 0, impressoes: 0, cliques: 0, leads: 0,
      cpl: null, ctr: null,
    };
    cur.investimento += row.investimento;
    cur.impressoes += row.impressoes;
    cur.cliques += row.cliques;
    cur.leads += row.leads;
    map.set(k, cur);
  };
  filtered.facebookAds.forEach((r) => upsert(r.campanha, "Facebook Ads", r));
  filtered.googleAds.forEach((r) => upsert(r.campanha, "Google Ads", r));
  return Array.from(map.values()).map((c) => ({
    ...c,
    cpl: safeDiv(c.investimento, c.leads),
    ctr: safeDiv(c.cliques, c.impressoes) != null ? (c.cliques / c.impressoes) * 100 : null,
  }));
}

export interface CriativoAgg {
  criativo: string;
  investimento: number;
  leads: number;
  cpl: number | null;
}
export function aggCriativos(
  rows: SheetsData["fbCriativos"],
  f: DashboardFilters,
): CriativoAgg[] {
  const map = new Map<string, CriativoAgg>();
  for (const r of rows) {
    if (!inRange(r.data, f.dataInicio, f.dataFim)) continue;
    const cur = map.get(r.criativo) ?? { criativo: r.criativo, investimento: 0, leads: 0, cpl: null };
    cur.investimento += r.investimento;
    cur.leads += r.leads;
    map.set(r.criativo, cur);
  }
  return Array.from(map.values()).map((c) => ({ ...c, cpl: safeDiv(c.investimento, c.leads) }));
}

export interface PublicoAgg {
  publico: string;
  investimento: number;
  leads: number;
  cpl: number | null;
}
export function aggPublicos(
  rows: SheetsData["fbPublicos"],
  f: DashboardFilters,
): PublicoAgg[] {
  const map = new Map<string, PublicoAgg>();
  for (const r of rows) {
    if (!inRange(r.data, f.dataInicio, f.dataFim)) continue;
    const cur = map.get(r.publico) ?? { publico: r.publico, investimento: 0, leads: 0, cpl: null };
    cur.investimento += r.investimento;
    cur.leads += r.leads;
    map.set(r.publico, cur);
  }
  return Array.from(map.values()).map((c) => ({ ...c, cpl: safeDiv(c.investimento, c.leads) }));
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
  return Array.from(map.values()).sort(
    (a, b) => ORDEM.indexOf(a.fase) - ORDEM.indexOf(b.fase),
  );
}

export function aggPlataformaInvestimento(filtered: FilteredData): {
  plataforma: string; investimento: number;
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
