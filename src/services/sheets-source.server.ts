// Fonte de dados OFICIAL do dashboard — Google Sheets alimentado pelo Stract.io.
//
// Este módulo é server-only (sufixo .server.ts): o Vite não o inclui no bundle
// do cliente. O fetch acontece no servidor (Nitro), o que evita problemas de
// CORS do endpoint gviz e mantém a lógica de parsing fora do navegador.
//
// Estrutura real da planilha (todas as abas são Meta/Facebook Ads, uma conta,
// separadas por objetivo de campanha):
//   - vendas         → OUTCOME_SALES      → tem funil de conversão completo
//   - engajamento    → OUTCOME_ENGAGEMENT → só métricas de topo/meio
//   - reconhecimento → OUTCOME_AWARENESS  → só métricas de topo
//
// As três abas compartilham o mesmo bloco inicial de colunas (índices 0–14):
//   0 Data · 3 Campanha · 5 Objetivo · 6 Conjunto/Adset · 7 Anúncio ·
//   9 Impressões · 10 Alcance · 12 Cliques · 14 Investimento
// A aba de vendas adiciona o funil (índices específicos abaixo).
import { getSheetsConfig } from "@/lib/config.server";
import type {
  ConnectRateRow,
  ConversaoRow,
  CriativoRow,
  FacebookAdsRow,
  FaseFunil,
  FaseRow,
  ISODate,
  MetaRow,
  PublicoQFRow,
  PublicoRow,
  SheetsData,
  SomatorioRow,
} from "@/types/sheets";

// Metas de referência (Ideal/Máximo) não existem na planilha — são projeções
// sobre o realizado até que metas reais sejam informadas. Ajuste aqui ou
// substitua por uma aba de metas quando disponível.
const META_MULT = {
  leads: { ideal: 1.15, maximo: 1.4 },
  vendas: { ideal: 1.2, maximo: 1.5 },
  faturamento: { ideal: 1.2, maximo: 1.5 },
  investimento: { ideal: 1.1, maximo: 1.25 },
} as const;

// ---------- Parsers de baixo nível ----------

/** Parser de CSV que respeita aspas e vírgulas/aspas escapadas dentro de campos. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Número no formato pt-BR: "1.234,56" → 1234.56 · "1,92" → 1.92 · "190" → 190. */
function num(raw: string | undefined): number {
  if (!raw) return 0;
  let t = raw.trim();
  if (!t || t === "-") return 0;
  t = t.replace(/[R$\s%]/g, "");
  if (t.includes(",")) {
    // vírgula é o separador decimal; ponto (se houver) é separador de milhar.
    t = t.replace(/\./g, "").replace(",", ".");
  } else if (t.includes(".")) {
    // sem vírgula: em pt-BR o ponto é separador de milhar (ex.: "27.778" = 27778).
    // Os dados do Stract nunca usam ponto como decimal (decimais sempre com vírgula).
    t = t.replace(/\./g, "");
  }
  const n = parseFloat(t);
  return isFinite(n) ? n : 0;
}

/** Aceita ISO (AAAA-MM-DD) ou pt-BR (DD/MM/AAAA); devolve ISO ou null. */
function isoDate(raw: string | undefined): ISODate | null {
  if (!raw) return null;
  const t = raw.trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(t);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

// ---------- Modelo normalizado (uma linha = um anúncio em um dia) ----------

interface NormRow {
  data: ISODate;
  campanha: string;
  objetivo: string;
  conjunto: string;
  anuncio: string;
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  leads: number;
  addToCart: number;
  initiateCheckout: number;
  purchase: number;
  faturamento: number;
}

// Índices de coluna. Bloco comum às três abas + funil exclusivo da aba de vendas.
const COL = {
  data: 0,
  campanha: 3,
  objetivo: 5,
  conjunto: 6,
  anuncio: 7,
  impressoes: 9,
  alcance: 10,
  cliques: 12,
  investimento: 14,
  // funil (só na aba de vendas):
  leads: 17,
  addToCart: 19,
  initiateCheckout: 20,
  purchase: 21,
  faturamento: 22,
} as const;

function csvUrl(spreadsheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
}

async function fetchTab(spreadsheetId: string, gid: string): Promise<string[][]> {
  const res = await fetch(csvUrl(spreadsheetId, gid), {
    redirect: "follow",
    headers: { accept: "text/csv" },
  });
  if (!res.ok) {
    throw new Error(`Falha ao ler a aba ${gid} da planilha (HTTP ${res.status}).`);
  }
  return parseCsv(await res.text());
}

/** Converte as linhas cruas de uma aba em NormRow[]. `hasFunnel` = aba de vendas. */
function normalizeTab(rows: string[][], hasFunnel: boolean): NormRow[] {
  const out: NormRow[] = [];
  // rows[0] é o cabeçalho (gviz inclui a linha de títulos).
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const data = isoDate(r[COL.data]);
    if (!data) continue; // ignora linhas sem data válida (vazias/rodapés)
    out.push({
      data,
      campanha: (r[COL.campanha] ?? "").trim() || "(sem campanha)",
      objetivo: (r[COL.objetivo] ?? "").trim(),
      conjunto: (r[COL.conjunto] ?? "").trim() || "(sem conjunto)",
      anuncio: (r[COL.anuncio] ?? "").trim() || "(sem anúncio)",
      investimento: num(r[COL.investimento]),
      impressoes: num(r[COL.impressoes]),
      alcance: num(r[COL.alcance]),
      cliques: num(r[COL.cliques]),
      leads: hasFunnel ? num(r[COL.leads]) : 0,
      addToCart: hasFunnel ? num(r[COL.addToCart]) : 0,
      initiateCheckout: hasFunnel ? num(r[COL.initiateCheckout]) : 0,
      purchase: hasFunnel ? num(r[COL.purchase]) : 0,
      faturamento: hasFunnel ? num(r[COL.faturamento]) : 0,
    });
  }
  return out;
}

// ---------- Classificações ----------

/** Objetivo da campanha → fase do funil de mídia. */
const FASE_POR_OBJETIVO: Record<string, FaseFunil> = {
  OUTCOME_AWARENESS: "Distribuição",
  OUTCOME_TRAFFIC: "Captação",
  OUTCOME_LEADS: "Captação",
  OUTCOME_ENGAGEMENT: "Aquecimento",
  OUTCOME_SALES: "Carrinho",
};

/** Temperatura do público inferida pelo nome da campanha/conjunto. */
function temperatura(campanha: string): "Quente" | "Frio" {
  const c = campanha.toUpperCase();
  if (/\b(QUENTE|MORNO|REMARK|RMK|LOOKALIKE|ENGAJAD|VISITANTE|CARRINHO)\b/.test(c)) return "Quente";
  return "Frio";
}

// ---------- Agregadores genéricos ----------

interface Acc {
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  leads: number;
}
function emptyAcc(): Acc {
  return { investimento: 0, impressoes: 0, alcance: 0, cliques: 0, leads: 0 };
}
function addInto(acc: Acc, r: NormRow): void {
  acc.investimento += r.investimento;
  acc.impressoes += r.impressoes;
  acc.alcance += r.alcance;
  acc.cliques += r.cliques;
  acc.leads += r.leads;
}

// ---------- Montagem do SheetsData ----------

function build(norm: NormRow[]): SheetsData {
  // Somatório diário
  const byDate = new Map<ISODate, Acc>();
  for (const r of norm) {
    const a = byDate.get(r.data) ?? emptyAcc();
    addInto(a, r);
    byDate.set(r.data, a);
  }
  const somatorio: SomatorioRow[] = Array.from(byDate.entries())
    .map(([data, a]) => ({ data, ...a }))
    .sort((x, y) => x.data.localeCompare(y.data));

  // Facebook Ads por (dia, campanha)
  const fbMap = new Map<string, FacebookAdsRow>();
  for (const r of norm) {
    const k = `${r.data}::${r.campanha}`;
    const cur =
      fbMap.get(k) ??
      ({ data: r.data, campanha: r.campanha, ...emptyAcc() } as FacebookAdsRow);
    cur.investimento += r.investimento;
    cur.impressoes += r.impressoes;
    cur.alcance += r.alcance;
    cur.cliques += r.cliques;
    cur.leads += r.leads;
    fbMap.set(k, cur);
  }
  const facebookAds = Array.from(fbMap.values());

  // Criativos por (dia, anúncio)
  const crMap = new Map<string, CriativoRow>();
  for (const r of norm) {
    const k = `${r.data}::${r.anuncio}`;
    const cur =
      crMap.get(k) ?? ({ data: r.data, criativo: r.anuncio, ...emptyAcc() } as CriativoRow);
    cur.investimento += r.investimento;
    cur.impressoes += r.impressoes;
    cur.alcance += r.alcance;
    cur.cliques += r.cliques;
    cur.leads += r.leads;
    crMap.set(k, cur);
  }
  const fbCriativos = Array.from(crMap.values());

  // Públicos (conjuntos/adsets) por (dia, conjunto)
  const pubMap = new Map<string, PublicoRow>();
  for (const r of norm) {
    const k = `${r.data}::${r.conjunto}`;
    const cur =
      pubMap.get(k) ?? ({ data: r.data, publico: r.conjunto, ...emptyAcc() } as PublicoRow);
    cur.investimento += r.investimento;
    cur.impressoes += r.impressoes;
    cur.alcance += r.alcance;
    cur.cliques += r.cliques;
    cur.leads += r.leads;
    pubMap.set(k, cur);
  }
  const fbPublicos = Array.from(pubMap.values());

  // Público Quente × Frio por dia
  const qMap = new Map<ISODate, PublicoQFRow>();
  const fMap = new Map<ISODate, PublicoQFRow>();
  for (const r of norm) {
    const target = temperatura(r.campanha) === "Quente" ? qMap : fMap;
    const cur =
      target.get(r.data) ??
      ({ data: r.data, investimento: 0, impressoes: 0, alcance: 0, cliques: 0, leads: 0 });
    cur.investimento += r.investimento;
    cur.impressoes += r.impressoes;
    cur.alcance += r.alcance;
    cur.cliques += r.cliques;
    cur.leads += r.leads;
    target.set(r.data, cur);
  }
  const publicoQ = Array.from(qMap.values()).sort((a, b) => a.data.localeCompare(b.data));
  const publicoF = Array.from(fMap.values()).sort((a, b) => a.data.localeCompare(b.data));

  // Fases do funil de mídia por (dia, fase)
  const faseMap = new Map<string, FaseRow>();
  for (const r of norm) {
    const fase = FASE_POR_OBJETIVO[r.objetivo];
    if (!fase) continue;
    const k = `${r.data}::${fase}`;
    const cur =
      faseMap.get(k) ??
      ({
        data: r.data,
        fase,
        investimento: 0,
        impressoes: 0,
        alcance: 0,
        cliques: 0,
        leads: 0,
      } as FaseRow);
    cur.investimento += r.investimento;
    cur.impressoes += r.impressoes;
    cur.alcance += r.alcance;
    cur.cliques += r.cliques;
    cur.leads = (cur.leads ?? 0) + r.leads;
    faseMap.set(k, cur);
  }
  const fases = Array.from(faseMap.values());

  // Funil de conversão por dia (só a aba de vendas contribui com esses campos).
  // thankYouPage não existe na planilha — usamos as compras como proxy (cada
  // compra concluída chega à página de obrigado).
  const convMap = new Map<ISODate, ConversaoRow>();
  for (const r of norm) {
    if (r.addToCart + r.initiateCheckout + r.purchase + r.faturamento === 0) continue;
    const cur =
      convMap.get(r.data) ??
      ({
        data: r.data,
        addToCart: 0,
        initiateCheckout: 0,
        purchase: 0,
        thankYouPage: 0,
        faturamento: 0,
      } as ConversaoRow);
    cur.addToCart += r.addToCart;
    cur.initiateCheckout += r.initiateCheckout;
    cur.purchase += r.purchase;
    cur.thankYouPage += r.purchase;
    cur.faturamento += r.faturamento;
    convMap.set(r.data, cur);
  }
  const conversoes = Array.from(convMap.values()).sort((a, b) => a.data.localeCompare(b.data));

  // Metas — realizado real; Ideal/Máximo são projeções (ver META_MULT).
  const totLeads = somatorio.reduce((s, x) => s + x.leads, 0);
  const totInv = somatorio.reduce((s, x) => s + x.investimento, 0);
  const totVendas = conversoes.reduce((s, x) => s + x.purchase, 0);
  const totFat = conversoes.reduce((s, x) => s + x.faturamento, 0);
  const metas: MetaRow[] = [
    {
      metrica: "Leads",
      realizado: totLeads,
      ideal: Math.round(totLeads * META_MULT.leads.ideal),
      maximo: Math.round(totLeads * META_MULT.leads.maximo),
      formato: "int",
    },
    {
      metrica: "Vendas",
      realizado: totVendas,
      ideal: Math.round(totVendas * META_MULT.vendas.ideal),
      maximo: Math.round(totVendas * META_MULT.vendas.maximo),
      formato: "int",
    },
    {
      metrica: "Faturamento",
      realizado: totFat,
      ideal: Math.round(totFat * META_MULT.faturamento.ideal),
      maximo: Math.round(totFat * META_MULT.faturamento.maximo),
      formato: "brl",
    },
    {
      metrica: "Investimento",
      realizado: totInv,
      ideal: Math.round(totInv * META_MULT.investimento.ideal),
      maximo: Math.round(totInv * META_MULT.investimento.maximo),
      formato: "brl",
    },
  ];

  // Seções sem fonte na planilha atual — ficam vazias e a UI degrada para "—".
  const connectRate: ConnectRateRow[] = [];

  return {
    somatorio,
    facebookAds,
    googleAds: [], // não há Google Ads na planilha
    fbCriativos,
    fbPublicos,
    publicoQ,
    publicoF,
    fases,
    ga4: [], // não há GA4 na planilha
    gruposWhats: [], // não há grupos de WhatsApp na planilha
    conversoes,
    connectRate,
    metas,
    ultimaAtualizacao: new Date().toISOString(),
  };
}

/** Busca as abas de dados, normaliza e monta o SheetsData oficial do dashboard. */
export async function buildSheetsData(): Promise<SheetsData> {
  const { spreadsheetId, gids } = getSheetsConfig();
  const [vendas, engajamento, reconhecimento] = await Promise.all([
    fetchTab(spreadsheetId, gids.vendas),
    fetchTab(spreadsheetId, gids.engajamento),
    fetchTab(spreadsheetId, gids.reconhecimento),
  ]);
  const norm: NormRow[] = [
    ...normalizeTab(vendas, true),
    ...normalizeTab(engajamento, false),
    ...normalizeTab(reconhecimento, false),
  ];
  return build(norm);
}
