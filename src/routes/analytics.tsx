import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Home, MousePointerClick, Target } from "lucide-react";

import { useDashboard } from "@/context/DashboardContext";
import { ChartCard } from "@/components/ChartCard";
import { aggConnectRate, fmtData, fmtInt, fmtPct, serieConnectRate } from "@/utils/metrics";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Dashboard WNBF Brazil" },
      { name: "description", content: "GA4 e Connect Rate da Home e das landing pages." },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  const { data, isLoading, filters } = useDashboard();

  const ga4 = useMemo(() => {
    if (!data) return [];
    return data.ga4
      .filter((r) => r.data >= filters.dataInicio && r.data <= filters.dataFim)
      .map((r) => ({ ...r, label: fmtData(r.data) }));
  }, [data, filters]);

  const cr = useMemo(
    () => (data ? aggConnectRate(data.connectRate, filters) : null),
    [data, filters],
  );
  const crSerie = useMemo(
    () => (data ? serieConnectRate(data.connectRate, filters) : []),
    [data, filters],
  );

  if (isLoading || !data || !cr) {
    return <div className="h-96 rounded-2xl border border-border bg-card animate-pulse" />;
  }

  const t = {
    contentStyle: {
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      fontSize: 12,
      color: "var(--foreground)",
    } as const,
  };

  return (
    <div className="space-y-6">
      {/* Connect Rate — Home Page e Landing pages posteriores */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <ConnectCard
          icon={Home}
          color="mint"
          titulo="Connect Rate"
          descricao="Sessões (Landing Page View) a cada clique no link"
          valor={fmtPct(cr.homeRate)}
          detalhe={`${fmtInt(cr.homeSessoes)} sessões / ${fmtInt(cr.cliques)} cliques no link`}
        />
        <ConnectCard
          icon={Target}
          color="blue"
          titulo="Landing pages posteriores"
          descricao="Sessões que avançaram para as próximas páginas (sem fonte na planilha)"
          valor={fmtPct(cr.landingRate)}
          detalhe={
            cr.landingRate == null ? "Sem dado disponível" : `${fmtInt(cr.landingSessoes)} sessões`
          }
        />
        <ConnectCard
          icon={MousePointerClick}
          color="lilac"
          titulo="Cliques no link"
          descricao="Base do Connect Rate"
          valor={fmtInt(cr.cliques)}
          detalhe="Total no período"
        />
      </div>

      <ChartCard
        title="Connect Rate por dia"
        subtitle="Home Page (cliques → sessão) × Landing posteriores (Home → próxima página)"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={crSerie} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              />
              <Tooltip {...t} formatter={(v: number, n: string) => [fmtPct(v), n]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="homeRate"
                name="Home Page"
                stroke="var(--chart-mint)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="landingRate"
                name="Landing posteriores"
                stroke="var(--chart-blue)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="GA4 — Sessões, Usuários e Novos Usuários"
        subtitle="Comportamento dos visitantes da página de captura"
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ga4} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              <Tooltip {...t} formatter={(v: number, n: string) => [fmtInt(v), n]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="sessoes"
                name="Sessões"
                stroke="var(--chart-blue)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="usuarios"
                name="Usuários"
                stroke="var(--chart-mint)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="novosUsuarios"
                name="Novos Usuários"
                stroke="var(--chart-lilac)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

const COLORS = {
  mint: "var(--chart-mint)",
  blue: "var(--chart-blue)",
  lilac: "var(--chart-lilac)",
} as const;

function ConnectCard({
  icon: Icon,
  color,
  titulo,
  descricao,
  valor,
  detalhe,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: keyof typeof COLORS;
  titulo: string;
  descricao: string;
  valor: string;
  detalhe: string;
}) {
  return (
    <div className="card-rise relative overflow-hidden rounded-2xl bg-card border border-border p-5 shadow-[var(--shadow-card)]">
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: COLORS[color] }} />
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `color-mix(in srgb, ${COLORS[color]} 12%, transparent)` }}
        >
          <Icon className="w-4 h-4" style={{ color: COLORS[color] }} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground leading-tight">{titulo}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{descricao}</div>
        </div>
      </div>
      <div className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
        {valor}
      </div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{detalhe}</div>
    </div>
  );
}
