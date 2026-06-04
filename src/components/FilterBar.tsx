import { Calendar, RefreshCw } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import type { FaseFiltro, FasePublicoFiltro, Plataforma } from "@/types/sheets";

const PLATAFORMAS: Plataforma[] = ["Todas", "Facebook Ads", "Google Ads"];
const FASES: FaseFiltro[] = [
  "Todas",
  "Distribuição",
  "Captação",
  "Aquecimento",
  "Lembrete",
  "Evento",
  "Carrinho",
];
const PUBLICOS: FasePublicoFiltro[] = ["Todos", "Quente", "Frio"];

function Select<T extends string>({
  label, value, options, onChange,
}: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <label className="flex flex-col text-[11px] font-medium text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="mt-1 h-9 rounded-xl border border-border bg-card px-3 text-sm text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export function FilterBar() {
  const { filters, setFilters, refetch, data } = useDashboard();
  const ultima = data
    ? new Date(data.ultimaAtualizacao).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
      })
    : "—";

  return (
    <div className="sticky top-0 z-20 bg-background/85 backdrop-blur border-b border-border">
      <div className="flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Dashboard de Tráfego — Lançamento WNBF Brazil
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Última atualização: {ultima}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Plataforma"
            value={filters.plataforma}
            options={PLATAFORMAS}
            onChange={(v) => setFilters({ plataforma: v })}
          />
          <Select
            label="Fase do funil"
            value={filters.fase}
            options={FASES}
            onChange={(v) => setFilters({ fase: v })}
          />
          <Select
            label="Público"
            value={filters.publico}
            options={PUBLICOS}
            onChange={(v) => setFilters({ publico: v })}
          />

          <div className="flex items-end gap-2 px-3 py-2 rounded-xl border border-border bg-card">
            <Calendar className="w-4 h-4 text-muted-foreground mb-1.5" />
            <label className="flex flex-col text-[11px] font-medium text-muted-foreground">
              De
              <input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => setFilters({ dataInicio: e.target.value })}
                className="mt-1 h-8 rounded-md border border-border bg-card px-2 text-sm text-foreground"
              />
            </label>
            <label className="flex flex-col text-[11px] font-medium text-muted-foreground">
              Até
              <input
                type="date"
                value={filters.dataFim}
                onChange={(e) => setFilters({ dataFim: e.target.value })}
                className="mt-1 h-8 rounded-md border border-border bg-card px-2 text-sm text-foreground"
              />
            </label>
          </div>

          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-xs hover:opacity-90 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>
    </div>
  );
}
