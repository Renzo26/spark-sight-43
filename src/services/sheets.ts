import type {
  ConnectRateRow,
  ConversaoRow,
  CriativoRow,
  FaseFunil,
  FaseRow,
  FacebookAdsRow,
  GA4Row,
  GoogleAdsRow,
  GrupoWhatsRow,
  MetaRow,
  PublicoQFRow,
  PublicoRow,
  SheetsData,
  SomatorioRow,
} from "@/types/sheets";

/**
 * Camada de dados — quando conectar à planilha real, troque `loadSheetsData`
 * para buscar cada aba via:
 *   https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=<NOME>
 * e fazer o parse com a mesma forma tipada abaixo.
 */
export const SHEETS_CONFIG = {
  spreadsheetId: "REPLACE_ME",
  abas: {
    somatorio: "Somatório",
    facebookAds: "Facebook Ads",
    googleAds: "Google Ads",
    fbCriativos: "Fb_Criativos",
    fbPublicos: "Fb_Publicos",
    publicoQ: "Público _Q",
    publicoF: "Público _F",
    distribuicao: "Distribuição",
    captacao: "Captação",
    aquecimento: "Aquecimento",
    lembrete: "Lembrete",
    evento: "Evento",
    carrinho: "Carrinho",
    ga4: "GA4",
    gruposWhats: "Grupos Whats",
  },
} as const;

// ---------- MOCK helpers ----------
function dateRange(days: number): string[] {
  const out: string[] = [];
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function rand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const DAYS = dateRange(21);
const r = rand(42);

// Curva de lançamento: cresce na captação e estoura no carrinho.
function phaseFactor(i: number): number {
  const t = i / (DAYS.length - 1);
  return 0.6 + Math.sin(t * Math.PI) * 0.8 + (t > 0.7 ? 1.4 : 0);
}

// ---------- Somatório ----------
const somatorio: SomatorioRow[] = DAYS.map((data, i) => {
  const inv = Math.round((280 + r() * 340) * phaseFactor(i));
  const impressoes = Math.round(inv * (120 + r() * 60));
  const alcance = Math.round(impressoes * (0.55 + r() * 0.15));
  const cliques = Math.round(impressoes * (0.012 + r() * 0.01));
  const leads = Math.round(cliques * (0.18 + r() * 0.1));
  return { data, investimento: inv, impressoes, alcance, cliques, leads };
});

// ---------- Facebook Ads ----------
const fbCampanhas = [
  "WNBF | Captação | LAL Compradores",
  "WNBF | Captação | Interesse Fitness",
  "WNBF | Aquecimento | Engajados",
  "WNBF | Lembrete | Inscritos",
  "WNBF | Carrinho | Remarketing",
];
const facebookAds: FacebookAdsRow[] = [];
DAYS.forEach((data, i) => {
  fbCampanhas.forEach((c, idx) => {
    const base = (somatorio[i].investimento * 0.7) / fbCampanhas.length;
    const inv = Math.round(base * (0.6 + r() * 0.9));
    const imp = Math.round(inv * (110 + r() * 50));
    const alc = Math.round(imp * (0.55 + r() * 0.15));
    const cli = Math.round(imp * (0.011 + r() * 0.01));
    const ld = Math.round(cli * (0.16 + r() * 0.12));
    facebookAds.push({
      data,
      campanha: c,
      investimento: inv,
      impressoes: imp,
      alcance: alc,
      cliques: cli,
      leads: ld,
    });
    void idx;
  });
});

// ---------- Google Ads ----------
const gCampanhas = ["WNBF | Search Marca", "WNBF | Search Genérico", "WNBF | YouTube Aquec."];
const googleAds: GoogleAdsRow[] = [];
DAYS.forEach((data, i) => {
  gCampanhas.forEach((c) => {
    const base = (somatorio[i].investimento * 0.3) / gCampanhas.length;
    const inv = Math.round(base * (0.7 + r() * 0.8));
    const imp = Math.round(inv * (80 + r() * 60));
    const alc = Math.round(imp * (0.6 + r() * 0.15));
    const cli = Math.round(imp * (0.02 + r() * 0.02));
    const ld = Math.round(cli * (0.2 + r() * 0.1));
    googleAds.push({
      data,
      campanha: c,
      investimento: inv,
      impressoes: imp,
      alcance: alc,
      cliques: cli,
      leads: ld,
    });
  });
});

// ---------- Criativos ----------
const criativos = [
  "VSL_Atleta_Pro_v3",
  "Carrossel_Beneficios_v2",
  "Depoimento_Campeão",
  "Reels_BastidoresWNBF",
  "Static_Inscrições_Abertas",
  "Reels_TreinoIntenso",
  "VSL_Historia_v1",
];
const fbCriativos: CriativoRow[] = [];
DAYS.forEach((data) => {
  criativos.forEach((cr, idx) => {
    const inv = Math.round(60 + r() * 220 + (idx === 0 ? 120 : 0));
    const imp = Math.round(inv * (110 + r() * 50));
    const alc = Math.round(imp * (0.55 + r() * 0.15));
    const cli = Math.round(imp * (0.011 + r() * 0.012));
    const ld = Math.round(inv * (0.04 + r() * 0.05) + (idx === 0 ? 8 : 0));
    fbCriativos.push({
      data,
      criativo: cr,
      investimento: inv,
      impressoes: imp,
      alcance: alc,
      cliques: cli,
      leads: ld,
    });
  });
});

// ---------- Públicos (Fb_Publicos) ----------
const publicos = [
  "LAL 1% Compradores",
  "Interesse Musculação",
  "Engajados Instagram 365d",
  "Visitantes Página Vendas",
  "Lista de Email",
  "LAL Inscritos Evento",
];
const fbPublicos: PublicoRow[] = [];
DAYS.forEach((data) => {
  publicos.forEach((p) => {
    const inv = Math.round(80 + r() * 260);
    const imp = Math.round(inv * (110 + r() * 50));
    const alc = Math.round(imp * (0.55 + r() * 0.15));
    const cli = Math.round(imp * (0.011 + r() * 0.012));
    const ld = Math.round(inv * (0.05 + r() * 0.06));
    fbPublicos.push({
      data,
      publico: p,
      investimento: inv,
      impressoes: imp,
      alcance: alc,
      cliques: cli,
      leads: ld,
    });
  });
});

// ---------- Público Quente / Frio ----------
function makePubQF(weight: number): PublicoQFRow[] {
  return DAYS.map((data, i) => {
    const inv = Math.round(somatorio[i].investimento * weight * (0.85 + r() * 0.3));
    const imp = Math.round(inv * (110 + r() * 50));
    const alc = Math.round(imp * (0.55 + r() * 0.15));
    const cli = Math.round(imp * (0.013 + r() * 0.01));
    const ld = Math.round(cli * (0.18 + r() * 0.1));
    return { data, investimento: inv, impressoes: imp, alcance: alc, cliques: cli, leads: ld };
  });
}
const publicoQ = makePubQF(0.35);
const publicoF = makePubQF(0.65);

// ---------- Fases do funil ----------
const fasesNomes: FaseFunil[] = [
  "Distribuição",
  "Captação",
  "Aquecimento",
  "Lembrete",
  "Evento",
  "Carrinho",
];
const pesos: Record<FaseFunil, number> = {
  Distribuição: 0.05,
  Captação: 0.45,
  Aquecimento: 0.12,
  Lembrete: 0.08,
  Evento: 0.1,
  Carrinho: 0.2,
};
const fases: FaseRow[] = [];
DAYS.forEach((data, i) => {
  fasesNomes.forEach((fase) => {
    const w = pesos[fase];
    const inv = Math.round(somatorio[i].investimento * w * (0.85 + r() * 0.3));
    const imp = Math.round(inv * (110 + r() * 50));
    const alc = Math.round(imp * (0.55 + r() * 0.15));
    const cli = Math.round(imp * (0.013 + r() * 0.01));
    const leads = fase === "Captação" ? Math.round(cli * (0.2 + r() * 0.1)) : undefined;
    fases.push({
      data,
      fase,
      investimento: inv,
      impressoes: imp,
      alcance: alc,
      cliques: cli,
      leads,
    });
  });
});

// ---------- GA4 ----------
const ga4: GA4Row[] = DAYS.map((data, i) => {
  const sessoes = Math.round(somatorio[i].cliques * (0.78 + r() * 0.18));
  const usuarios = Math.round(sessoes * (0.78 + r() * 0.08));
  const novos = Math.round(usuarios * (0.6 + r() * 0.15));
  return { data, sessoes, usuarios, novosUsuarios: novos };
});

// ---------- Grupos WhatsApp ----------
const gruposWhats: GrupoWhatsRow[] = [
  { grupo: "Grupo VIP 01", leads: 412 },
  { grupo: "Grupo VIP 02", leads: 387 },
  { grupo: "Grupo Atletas SP", leads: 298 },
  { grupo: "Grupo Atletas RJ", leads: 256 },
  { grupo: "Grupo Coaches", leads: 198 },
  { grupo: "Grupo Geral 01", leads: 174 },
  { grupo: "Grupo Geral 02", leads: 142 },
  { grupo: "Grupo Recém-inscritos", leads: 96 },
];

// ---------- Funil de ações de conversão (não nativo) ----------
const TICKET_MEDIO = 497; // ticket médio do produto (BRL)
const conversoes: ConversaoRow[] = DAYS.map((data, i) => {
  const leads = somatorio[i].leads;
  // Funil decrescente: parte dos leads adiciona ao carrinho, e segue afunilando.
  const addToCart = Math.round(leads * (0.32 + r() * 0.1));
  const initiateCheckout = Math.round(addToCart * (0.6 + r() * 0.12));
  const purchase = Math.round(initiateCheckout * (0.45 + r() * 0.15));
  const thankYouPage = Math.round(purchase * (0.9 + r() * 0.1));
  const faturamento = Math.round(purchase * TICKET_MEDIO * (0.92 + r() * 0.18));
  return { data, addToCart, initiateCheckout, purchase, thankYouPage, faturamento };
});

// ---------- Connect Rate (Home Page × Landing pages posteriores) ----------
const connectRate: ConnectRateRow[] = DAYS.map((data, i) => {
  const cliques = somatorio[i].cliques;
  const homeSessoes = Math.round(cliques * (0.7 + r() * 0.15)); // % que chega à Home
  const landingSessoes = Math.round(homeSessoes * (0.55 + r() * 0.2)); // % que avança
  return { data, cliques, homeSessoes, landingSessoes };
});

// ---------- Metas (realizado × Ideal × Máximo) ----------
const totLeads = somatorio.reduce((s, x) => s + x.leads, 0);
const totInv = somatorio.reduce((s, x) => s + x.investimento, 0);
const totVendas = conversoes.reduce((s, x) => s + x.purchase, 0);
const totFat = conversoes.reduce((s, x) => s + x.faturamento, 0);
const metas: MetaRow[] = [
  {
    metrica: "Leads",
    realizado: totLeads,
    ideal: Math.round(totLeads * 1.15),
    maximo: Math.round(totLeads * 1.4),
    formato: "int",
  },
  {
    metrica: "Vendas",
    realizado: totVendas,
    ideal: Math.round(totVendas * 1.2),
    maximo: Math.round(totVendas * 1.5),
    formato: "int",
  },
  {
    metrica: "Faturamento",
    realizado: totFat,
    ideal: Math.round(totFat * 1.2),
    maximo: Math.round(totFat * 1.5),
    formato: "brl",
  },
  {
    metrica: "Investimento",
    realizado: totInv,
    ideal: Math.round(totInv * 1.1),
    maximo: Math.round(totInv * 1.25),
    formato: "brl",
  },
];

const MOCK: SheetsData = {
  somatorio,
  facebookAds,
  googleAds,
  fbCriativos,
  fbPublicos,
  publicoQ,
  publicoF,
  fases,
  ga4,
  gruposWhats,
  conversoes,
  connectRate,
  metas,
  ultimaAtualizacao: new Date().toISOString(),
};

/** Substituir por fetch real ao Google Sheets quando a planilha estiver pronta. */
export async function loadSheetsData(): Promise<SheetsData> {
  // Simula latência de rede
  await new Promise((res) => setTimeout(res, 250));
  return { ...MOCK, ultimaAtualizacao: new Date().toISOString() };
}
