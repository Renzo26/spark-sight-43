import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";

import { useDashboard } from "@/context/DashboardContext";
import { ChartCard } from "@/components/ChartCard";
import { fmtData, fmtInt } from "@/utils/metrics";

export const Route = createFileRoute("/midia")({
  head: () => ({
    meta: [
      { title: "Mídia — Dashboard WNBF Brazil" },
      { name: "description", content: "Métricas de GA4 e grupos de WhatsApp." },
    ],
  }),
  component: Midia,
});

function Midia() {
  const { data, isLoading, filters } = useDashboard();

  const ga4 = useMemo(() => {
    if (!data) return [];
    return data.ga4
      .filter((r) => r.data >= filters.dataInicio && r.data <= filters.dataFim)
      .map((r) => ({ ...r, label: fmtData(r.data) }));
  }, [data, filters]);

  const grupos = useMemo(
    () => (data ? [...data.gruposWhats].sort((a, b) => b.leads - a.leads) : []),
    [data],
  );

  if (isLoading || !data) {
    return <div className="h-96 rounded-2xl border border-border bg-card animate-pulse" />;
  }

  const t = {
    contentStyle: {
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 12, fontSize: 12, color: "var(--foreground)",
    } as const,
  };

  return (
    <div className="space-y-6">
      <ChartCard title="GA4 — Sessões, Usuários e Novos Usuários" subtitle="Comportamento dos visitantes da página de captura">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ga4} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
              <Tooltip {...t} formatter={(v: number, n: string) => [fmtInt(v), n]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="sessoes" name="Sessões" stroke="var(--chart-blue)" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="usuarios" name="Usuários" stroke="var(--chart-mint)" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="novosUsuarios" name="Novos Usuários" stroke="var(--chart-lilac)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Leads por Grupo de WhatsApp" subtitle="Aba Grupos Whats">
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={grupos} layout="vertical" margin={{ top: 8, right: 24, left: 32, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis type="category" dataKey="grupo" tickLine={false} axisLine={false}
                fontSize={12} stroke="var(--foreground)" width={140} />
              <Tooltip {...t} formatter={(v: number) => [fmtInt(v), "Leads"]} />
              <Bar dataKey="leads" fill="var(--chart-coral)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
