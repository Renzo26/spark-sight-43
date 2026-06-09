import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { CriativoPreview } from "@/components/CriativoPreview";
import {
  aggCampanhas,
  aggCriativos,
  aggPublicos,
  aggQF,
  applyFilters,
  fmtBRL,
  fmtInt,
  fmtPct,
} from "@/utils/metrics";
import type { CampanhaAgg, CriativoAgg, PublicoAgg, QFAgg } from "@/utils/metrics";

export const Route = createFileRoute("/detalhamento")({
  head: () => ({
    meta: [
      { title: "Detalhamento — Dashboard WNBF Brazil" },
      { name: "description", content: "Tabelas de campanhas, criativos e públicos com ranking." },
    ],
  }),
  component: Detalhamento,
});

function Detalhamento() {
  const { data, isLoading, filters } = useDashboard();
  const [criativoSel, setCriativoSel] = useState<CriativoAgg | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const filtered = useMemo(() => (data ? applyFilters(data, filters) : null), [data, filters]);
  const campanhas = useMemo(() => (filtered ? aggCampanhas(filtered) : []), [filtered]);
  const criativos = useMemo(
    () => (data ? aggCriativos(data.fbCriativos, filters).sort((a, b) => b.leads - a.leads) : []),
    [data, filters],
  );
  const publicos = useMemo(
    () => (data ? aggPublicos(data.fbPublicos, filters).sort((a, b) => b.leads - a.leads) : []),
    [data, filters],
  );
  const qf = useMemo(() => (data ? aggQF(data, filters) : []), [data, filters]);

  if (isLoading || !data) {
    return <div className="h-96 rounded-2xl border border-border bg-card animate-pulse" />;
  }

  const abrirPreview = (c: CriativoAgg) => {
    setCriativoSel(c);
    setPreviewOpen(true);
  };

  const colsCamp: DataTableColumn<CampanhaAgg>[] = [
    {
      key: "campanha",
      label: "Campanha",
      render: (r) => (
        <div>
          <div className="font-medium text-foreground">{r.campanha}</div>
          <div className="text-[11px] text-muted-foreground">{r.plataforma}</div>
        </div>
      ),
    },
    {
      key: "investimento",
      label: "Investimento",
      align: "right",
      render: (r) => fmtBRL(r.investimento),
    },
    { key: "impressoes", label: "Impressões", align: "right", render: (r) => fmtInt(r.impressoes) },
    { key: "cliques", label: "Cliques", align: "right", render: (r) => fmtInt(r.cliques) },
    { key: "leads", label: "Leads", align: "right", render: (r) => fmtInt(r.leads) },
    {
      key: "cpl",
      label: "CPL",
      align: "right",
      render: (r) => fmtBRL(r.cpl ?? undefined),
      sortValue: (r) => r.cpl,
    },
    {
      key: "ctr",
      label: "CTR",
      align: "right",
      render: (r) => fmtPct(r.ctr ?? undefined),
      sortValue: (r) => r.ctr,
    },
  ];

  const colsCriativos: DataTableColumn<CriativoAgg>[] = [
    {
      key: "criativo",
      label: "Criativo",
      render: (r) => (
        <span className="font-medium text-foreground underline-offset-2 hover:underline">
          {r.criativo}
        </span>
      ),
    },
    {
      key: "investimento",
      label: "Investimento",
      align: "right",
      render: (r) => fmtBRL(r.investimento),
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

  const colsPublicos: DataTableColumn<PublicoAgg>[] = [
    { key: "publico", label: "Público" },
    {
      key: "investimento",
      label: "Investimento",
      align: "right",
      render: (r) => fmtBRL(r.investimento),
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

  const tStyle = {
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
      <ChartCard title="Campanhas" subtitle="Facebook Ads + Google Ads">
        <DataTable
          columns={colsCamp}
          rows={campanhas}
          initialSort={{ key: "investimento", dir: "desc" }}
        />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Ranking de Criativos" subtitle="Clique em um criativo para ver o preview">
          <DataTable
            columns={colsCriativos}
            rows={criativos}
            initialSort={{ key: "leads", dir: "desc" }}
            highlightBest={{ key: "cpl", better: "lower" }}
            onRowClick={abrirPreview}
          />
        </ChartCard>

        <ChartCard title="Ranking de Públicos" subtitle="Aba Fb_Publicos">
          <DataTable
            columns={colsPublicos}
            rows={publicos}
            initialSort={{ key: "leads", dir: "desc" }}
            highlightBest={{ key: "cpl", better: "lower" }}
          />
        </ChartCard>
      </div>

      <ChartCard title="Público Quente × Frio" subtitle="Investimento, Leads e CPL">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={qf as QFAgg[]} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="tipo"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                stroke="var(--muted-foreground)"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="var(--muted-foreground)"
                tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                {...tStyle}
                formatter={(v: number, n: string) => {
                  if (n === "Investimento") return [fmtBRL(v), n];
                  if (n === "CPL") return [fmtBRL(v), n];
                  return [fmtInt(v), n];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="investimento"
                name="Investimento"
                fill="var(--chart-blue)"
                radius={[8, 8, 0, 0]}
              />
              <Bar dataKey="leads" name="Leads" fill="var(--chart-mint)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="cpl" name="CPL" fill="var(--chart-coral)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <CriativoPreview criativo={criativoSel} open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}
