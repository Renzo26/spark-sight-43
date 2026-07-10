import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { loadSheetsData } from "@/services/sheets";
import type { DashboardFilters, SheetsData } from "@/types/sheets";
import { defaultDateRange } from "@/utils/metrics";

interface Ctx {
  data: SheetsData | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  filters: DashboardFilters;
  setFilters: (next: Partial<DashboardFilters>) => void;
}

const DashboardCtx = createContext<Ctx | null>(null);

const TODAY = new Date().toISOString().slice(0, 10);
const INITIAL: DashboardFilters = {
  dataInicio: TODAY,
  dataFim: TODAY,
};

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<DashboardFilters>(INITIAL);
  const [touchedDates, setTouchedDates] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["sheets-data"],
    queryFn: () => loadSheetsData(),
    staleTime: 60_000,
  });

  // Inicializa o intervalo com o range completo dos dados na primeira carga.
  const filtersResolved = useMemo<DashboardFilters>(() => {
    if (data && !touchedDates) {
      const { ini, fim } = defaultDateRange(data);
      return { ...filters, dataInicio: ini, dataFim: fim };
    }
    return filters;
  }, [data, touchedDates, filters]);

  const setFilters = (next: Partial<DashboardFilters>) => {
    if (next.dataInicio || next.dataFim) setTouchedDates(true);
    setFiltersState((prev) => ({ ...filtersResolved, ...prev, ...next }));
  };

  return (
    <DashboardCtx.Provider
      value={{
        data,
        isLoading,
        isError,
        refetch: () => void refetch(),
        filters: filtersResolved,
        setFilters,
      }}
    >
      {children}
    </DashboardCtx.Provider>
  );
}

export function useDashboard(): Ctx {
  const ctx = useContext(DashboardCtx);
  if (!ctx) throw new Error("useDashboard fora do DashboardProvider");
  return ctx;
}
