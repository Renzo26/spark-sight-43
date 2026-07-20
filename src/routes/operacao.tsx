import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useDashboard } from "@/context/DashboardContext";
import { ChartCard } from "@/components/ChartCard";
import { FunnelChart } from "@/components/FunnelChart";
import {
  aggConversoes,
  applyFilters,
  computeKpis,
  fmtBRL,
  fmtInt,
  fmtPct,
  serieConversao,
} from "@/utils/metrics";

export const Route = createFileRoute("/operacao")({
  head: () => ({
    meta: [
      { title: "Operação — Dashboard WNBF Brazil" },
      {
        name: "description",
        content: "Funil de ações de conversão: carrinho, checkout, compra e obrigado.",
      },
    ],
  }),
  component: Operacao,
});

function Operacao() {
  const { data, isLoading, filters } = useDashboard();

  const filtered = useMemo(() => (data ? applyFilters(data, filters) : null), [data, filters]);
  const kpis = useMemo(
    () =>
      data && filtered
        ? computeKpis(filtered, data.ga4, data.conversoes, data.connectRate, filters)
        : null,
    [data, filtered, filters],
  );
  const conv = useMemo(
    () => (data ? aggConversoes(data.conversoes, filters) : null),
    [data, filters],
  );
  const serie = useMemo(
    () => (data ? serieConversao(data.conversoes, filters) : []),
    [data, filters],
  );

  if (isLoading || !data || !kpis || !conv) {
    return <div className="h-96 rounded-2xl border border-border bg-card animate-pulse" />;
  }

  const stages = [
    { label: "Leads", value: kpis.leads },
    { label: "Adicionar ao Carrinho", value: conv.addToCart },
    { label: "Iniciar Checkout", value: conv.initiateCheckout },
    { label: "Compras", value: conv.purchase },
    { label: "Página de Obrigado", value: conv.thankYouPage },
  ];

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
      {/* Resumo de conversão */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MiniKpi
          label="Add to Cart (Adicionar ao Carrinho)"
          value={fmtInt(conv.addToCart)}
          color="lilac"
        />
        <MiniKpi
          label="Initiate Checkout (Iniciar Checkout)"
          value={fmtInt(conv.initiateCheckout)}
          color="blue"
        />
        <MiniKpi label="Purchase (Compras)" value={fmtInt(conv.purchase)} color="mint" />
        <MiniKpi
          label="ThankYou Page (Página de Obrigado)"
          value={fmtInt(conv.thankYouPage)}
          color="coral"
        />
        <MiniKpi
          label="Faturamento (Receita gerada)"
          value={fmtBRL(conv.faturamento)}
          color="mint"
        />
        <MiniKpi label="CPA (Custo por Aquisição)" value={fmtBRL(kpis.cpa)} color="coral" />
        <MiniKpi label="Ticket Médio" value={fmtBRL(kpis.ticketMedio)} color="blue" />
        <MiniKpi
          label="ROAS (Retorno sobre Investimento)"
          value={`${kpis.roas != null ? kpis.roas.toFixed(2).replace(".", ",") : "—"}x`}
          color="lilac"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <ChartCard
            title="Funil de Ações de Conversão"
            subtitle="Lead → Carrinho → Checkout → Compra → Obrigado"
          >
            <FunnelChart stages={stages} />
          </ChartCard>
        </div>

        <div className="lg:col-span-7">
          <ChartCard
            title="Ações de conversão por dia"
            subtitle="Volume diário de cada etapa do funil"
          >
            <div className="h-80">
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
                  <Tooltip {...t} formatter={(v: number, n: string) => [fmtInt(v), n]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="addToCart"
                    name="Carrinho"
                    fill="var(--chart-lilac)"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="initiateCheckout"
                    name="Checkout"
                    fill="var(--chart-blue)"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="purchase"
                    name="Compras"
                    fill="var(--chart-mint)"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="thankYouPage"
                    name="Obrigado"
                    fill="var(--chart-coral)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>

      <ChartCard
        title="Taxas de conversão entre etapas"
        subtitle="Eficiência de cada passagem do funil"
      >
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <MiniKpi
            label="Lead → Carrinho"
            value={fmtPct(taxa(conv.addToCart, kpis.leads))}
            color="lilac"
          />
          <MiniKpi
            label="Carrinho → Checkout"
            value={fmtPct(taxa(conv.initiateCheckout, conv.addToCart))}
            color="blue"
          />
          <MiniKpi
            label="Checkout → Compra"
            value={fmtPct(taxa(conv.purchase, conv.initiateCheckout))}
            color="mint"
          />
          <MiniKpi
            label="Lead → Compra"
            value={fmtPct(taxa(conv.purchase, kpis.leads))}
            color="coral"
          />
        </div>
      </ChartCard>
    </div>
  );
}

function taxa(num: number, den: number): number | null {
  return den > 0 ? (num / den) * 100 : null;
}

function MiniKpi({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "blue" | "mint" | "lilac" | "coral";
}) {
  const map = {
    blue: "var(--chart-blue)",
    mint: "var(--chart-mint)",
    lilac: "var(--chart-lilac)",
    coral: "var(--chart-coral)",
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
