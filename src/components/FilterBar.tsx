import { Calendar, PanelLeftClose, PanelLeftOpen, RefreshCw } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { HEADER_BG } from "@/components/Sidebar";

const CHIP_BG = "rgba(255,255,255,0.10)";
const CHIP_BORDER = "rgba(255,255,255,0.14)";

interface FilterBarProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function FilterBar({ sidebarOpen = true, onToggleSidebar }: FilterBarProps) {
  const { filters, setFilters, refetch, data } = useDashboard();
  const ultima = data
    ? new Date(data.ultimaAtualizacao).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div
      className="md:sticky md:top-0 z-20 text-white"
      style={{ background: HEADER_BG, borderBottom: "3px solid var(--brand-yellow)" }}
    >
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:h-32 lg:flex-row lg:items-center lg:justify-between lg:py-0">
        {/* Esquerda: logos + título */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              aria-label={sidebarOpen ? "Fechar menu lateral" : "Abrir menu lateral"}
              className="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-lg text-white shrink-0 hover:bg-white/15 transition"
              style={{ background: CHIP_BG, border: `1px solid ${CHIP_BORDER}` }}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>
          )}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <img
              src="/logo-wnbf-brazil.png"
              alt="WNBF Brazil"
              className="h-24 w-24 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
            />
            <img
              src="/logo-evento.png"
              alt="Natural Fitness & Health Expo 2026"
              className="h-24 w-24 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
            />
          </div>

          <div className="hidden sm:block w-px h-14 bg-white/20" />

          <div
            className="min-w-0 rounded-xl px-4 py-2.5"
            style={{ background: CHIP_BG, border: `1px solid ${CHIP_BORDER}` }}
          >
            <h1 className="font-display text-base sm:text-lg font-extrabold tracking-tight leading-tight truncate">
              Dashboard de Tráfego - WNBF Brazil Natural Fitness &amp; Health Expo 2026
            </h1>
          </div>
        </div>

        {/* Direita: data + atualizar */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="hidden lg:inline text-[11px] text-white/55">
            Atualizado em {ultima}
          </span>

          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="date"
              value={filters.dataInicio}
              onChange={(e) => setFilters({ dataInicio: e.target.value })}
              className="h-7 bg-transparent text-sm text-slate-700 focus:outline-none"
            />
            <span className="text-slate-400">—</span>
            <input
              type="date"
              value={filters.dataFim}
              onChange={(e) => setFilters({ dataFim: e.target.value })}
              className="h-7 bg-transparent text-sm text-slate-700 focus:outline-none"
            />
          </div>

          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-white text-slate-800 text-sm font-semibold shadow-xs hover:bg-white/90 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>
    </div>
  );
}
