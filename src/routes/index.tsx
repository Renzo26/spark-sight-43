import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DollarSign,
  Eye,
  MousePointerClick,
  Receipt,
  ShoppingCart,
  Users,
  UserPlus,
} from "lucide-react";

import { useDashboard } from "@/context/DashboardContext";
import { KpiCard } from "@/components/KpiCard";
import { ChartCard } from "@/components/ChartCard";
import { FunnelChart } from "@/components/FunnelChart";
import { MetasChart } from "@/components/MetasChart";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import {
  aggCriativos,
  applyFilters,
  computeKpis,
  fmtBRL,
  fmtInt,
  fmtNum,
  fmtPct,
  metricLabel,
  serieTemporal,
} from "@/utils/metrics";
import type { CriativoAgg } from "@/utils/metrics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão Geral — Dashboard WNBF Brazil" },
      {
        name: "description",
        content: "Resumo de investimento, leads, alcance e funil do lançamento WNBF Brazil.",
      },
    ],
  }),
  component: VisaoGeral,
});

function tooltipStyle() {
  return {
    contentStyle: {
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      fontSize: 12,
      color: "var(--foreground)",
      boxShadow: "0 8px 24px -12px rgba(15,23,42,0.18)",
    } as const,
    labelStyle: { color: "var(--muted-foreground)", fontWeight: 500 } as const,
  };
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-32 rounded-2xl bg-card border border-border animate-pulse" />
      ))}
    </div>
  );
}

function VisaoGeral() {
  const { data, isLoading, isError, filters } = useDashboard();

  const filtered = useMemo(() => (data ? applyFilters(data, filters) : null), [data, filters]);
  const kpis = useMemo(
    () =>
      data && filtered
        ? computeKpis(filtered, data.ga4, data.conversoes, data.connectRate, filters)
        : null,
    [data, filtered, filters],
  );
  const serie = useMemo(() => (filtered ? serieTemporal(filtered) : []), [filtered]);
  const criativos = useMemo(
    () =>
      data
        ? aggCriativos(data.fbCriativos, filters)
            .sort((a, b) => b.leads - a.leads)
            .slice(0, 6)
        : [],
    [data, filters],
  );

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Erro ao carregar os dados. Tente atualizar.
      </div>
    );
  }

  if (isLoading || !kpis || !filtered || !data) {
    return (
      <div className="space-y-4">
        <SkeletonGrid />
        <div className="h-72 rounded-2xl bg-card border border-border animate-pulse" />
      </div>
    );
  }

  const sparkInv = serie.map((s) => s.investimento);
  const sparkLeads = serie.map((s) => s.leads);
  const sparkCli = serie.map((s) => s.cliques);
  const sparkAlc = serie.map((s) => s.alcance);
  const sparkImp = serie.map((s) => s.impressoes);

  const funilStages = [
    { label: "Impressões", value: kpis.impressoes },
    { label: "Alcance", value: kpis.alcance },
    { label: "Cliques", value: kpis.cliques },
    { label: "Sessões", value: kpis.sessoes },
    { label: "Leads", value: kpis.leads },
    { label: "Compras", value: kpis.compras ?? 0 },
  ];

  const colsCriativos: DataTableColumn<CriativoAgg>[] = [
    {
      key: "criativo",
      label: "Criativo",
      render: (r) => <span className="font-medium text-foreground">{r.criativo}</span>,
    },
    { key: "leads", label: "Leads", align: "right", render: (r) => fmtInt(r.leads) },
    {
      key: "cpl",
      label: "CPL",
      align: "right",
      render: (r) => fmtBRL(r.cpl ?? undefined),
      sortValue: (r) => r.cpl,
    },
  ];

  const t = tooltipStyle();

  return (
    <div className="space-y-6">
      {/* Linha de KPIs */}
      <div className="kpi-grid grid gap-4 grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
        <KpiCard
          title="Faturamento"
          value={fmtBRL(kpis.faturamento)}
          hint={`ROAS ${fmtNum(kpis.roas)}x`}
          icon={Receipt}
          accent="mint"
          delta={9.2}
        />
        <KpiCard
          title="Vendas"
          value={fmtInt(kpis.compras)}
          hint={`Ticket médio ${fmtBRL(kpis.ticketMedio)}`}
          icon={ShoppingCart}
          accent="lilac"
          delta={7.5}
        />
        <KpiCard
          title="Investimento"
          value={fmtBRL(kpis.investimento)}
          hint={`Período: ${serie.length} dia(s)`}
          icon={DollarSign}
          accent="blue"
          series={sparkInv}
          delta={4.8}
        />
        <KpiCard
          title="Leads"
          value={fmtInt(kpis.leads)}
          hint={`CPL (Custo por Lead) ${fmtBRL(kpis.cpl)}`}
          icon={UserPlus}
          accent="lilac"
          series={sparkLeads}
          delta={12.3}
        />
        <KpiCard
          title="Cliques"
          value={fmtInt(kpis.cliques)}
          hint={`CTR (Taxa de Cliques) ${fmtPct(kpis.ctr)}`}
          icon={MousePointerClick}
          accent="blue"
          series={sparkCli}
          delta={3.4}
        />
        <KpiCard
          title="Alcance"
          value={fmtInt(kpis.alcance)}
          hint={`Freq. ${fmtNum(kpis.frequencia)}`}
          icon={Users}
          accent="coral"
          series={sparkAlc}
          delta={-1.6}
          deltaInverse
        />
        <KpiCard
          title="Impressões"
          value={fmtInt(kpis.impressoes)}
          hint={`CPM (Custo por Mil) ${fmtBRL(kpis.cpm)}`}
          icon={Eye}
          accent="yellow"
          series={sparkImp}
          delta={2.1}
        />
      </div>

      {/* Linha principal: 3 colunas */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Esquerda — Funil */}
        <div className="lg:col-span-4 space-y-4">
          <ChartCard title="Funil de Tráfego" subtitle="Volume e conversão entre etapas">
            <FunnelChart stages={funilStages} />
          </ChartCard>

          <div className="grid grid-cols-2 gap-3">
            <MiniStat label={metricLabel("CTR")} value={fmtPct(kpis.ctr)} color="lilac" />
            <MiniStat
              label={metricLabel("Frequência")}
              value={fmtNum(kpis.frequencia)}
              color="coral"
            />
            <MiniStat
              label={metricLabel("Connect Rate")}
              value={fmtPct(kpis.connectRate)}
              color="mint"
            />
            <MiniStat label={metricLabel("CPL")} value={fmtBRL(kpis.cpl)} color="blue" />
          </div>
        </div>

        {/* Centro — Custos + Série principal */}
        <div className="lg:col-span-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label={metricLabel("CPL")} value={fmtBRL(kpis.cpl)} color="blue" />
            <MiniStat label={metricLabel("CPC")} value={fmtBRL(kpis.cpc)} color="lilac" />
            <MiniStat label={metricLabel("CPM")} value={fmtBRL(kpis.cpm)} color="coral" />
            <MiniStat
              label={metricLabel("Custo / Sessão")}
              value={fmtBRL(kpis.custoPorSessao)}
              color="mint"
            />
          </div>

          <ChartCard title="Investimento × Leads por dia" subtitle="Série temporal com eixo duplo">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serie} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-mint)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--chart-mint)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="var(--muted-foreground)"
                    tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="var(--muted-foreground)"
                  />
                  <Tooltip
                    {...t}
                    formatter={(value: number, name: string) =>
                      name === "Investimento" ? [fmtBRL(value), name] : [fmtInt(value), name]
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="investimento"
                    name="Investimento"
                    stroke="var(--chart-mint)"
                    strokeWidth={2.5}
                    fill="url(#inv)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="leads"
                    name="Leads"
                    stroke="var(--chart-blue)"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Leads por dia">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serie} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="var(--muted-foreground)"
                  />
                  <Tooltip {...t} formatter={(v: number) => [fmtInt(v), "Leads"]} />
                  <Bar dataKey="leads" radius={[8, 8, 0, 0]} fill="var(--chart-lilac)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Direita — Melhores Criativos (tabela) */}
        <div className="lg:col-span-3 space-y-4">
          <ChartCard title="Melhores Criativos" subtitle="Top 6 por leads">
            <DataTable
              columns={colsCriativos}
              rows={criativos}
              initialSort={{ key: "leads", dir: "desc" }}
            />
          </ChartCard>
        </div>
      </div>

      {/* Metas do lançamento — realizado × Ideal × Máximo */}
      <ChartCard
        title="Metas do Lançamento"
        subtitle="Realizado sobre as faixas de referência Ideal e Máximo"
      >
        <MetasChart metas={data.metas} />
      </ChartCard>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "blue" | "mint" | "lilac" | "coral" | "yellow";
}) {
  const map: Record<typeof color, string> = {
    blue: "var(--chart-blue)",
    mint: "var(--chart-mint)",
    lilac: "var(--chart-lilac)",
    coral: "var(--chart-coral)",
    yellow: "var(--chart-yellow)",
  };
  return (
    <div className="rounded-xl bg-card border border-border p-3">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: map[color] }} />
        <span className="text-[10px] text-muted-foreground font-medium leading-tight">{label}</span>
      </div>
      <div className="mt-1 text-lg font-bold text-foreground tabular-nums">{value}</div>
    </div>
  );
}
