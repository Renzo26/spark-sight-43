import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  /** Valor numérico/textual usado para ordenar quando `render` não é uma string. */
  sortValue?: (row: T) => number | string | null;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  initialSort?: { key: string; dir: "asc" | "desc" };
  emptyMessage?: string;
  highlightBest?: { key: string; better: "lower" | "higher" };
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns, rows, initialSort, emptyMessage = "Sem dados no período.", highlightBest, onRowClick,
}: DataTableProps<T>) {
  const [sort, setSort] = useState(initialSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const get = (r: T): number | string | null => {
      if (col.sortValue) return col.sortValue(r);
      const v = (r as Record<string, unknown>)[col.key];
      return typeof v === "number" || typeof v === "string" ? v : null;
    };
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = get(a); const bv = get(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * sign;
      return String(av).localeCompare(String(bv)) * sign;
    });
  }, [rows, sort, columns]);

  const bestWorst = useMemo(() => {
    if (!highlightBest || sorted.length === 0) return { best: null as T | null, worst: null as T | null };
    const col = columns.find((c) => c.key === highlightBest.key);
    if (!col) return { best: null, worst: null };
    const get = (r: T): number | null => {
      const v = col.sortValue ? col.sortValue(r) : (r as Record<string, unknown>)[col.key];
      return typeof v === "number" && isFinite(v) ? v : null;
    };
    const withVal = sorted.map((r) => ({ r, v: get(r) })).filter((x) => x.v != null) as { r: T; v: number }[];
    if (withVal.length === 0) return { best: null, worst: null };
    const asc = [...withVal].sort((a, b) => a.v - b.v);
    return highlightBest.better === "lower"
      ? { best: asc[0].r, worst: asc[asc.length - 1].r }
      : { best: asc[asc.length - 1].r, worst: asc[0].r };
  }, [sorted, highlightBest, columns]);

  const onSort = (key: string) => {
    setSort((cur) =>
      cur?.key === key ? { key, dir: cur.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" },
    );
  };

  return (
    <div className="overflow-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-muted-foreground">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={[
                  "px-4 py-2.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap",
                  c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left",
                ].join(" ")}
              >
                {c.sortable === false ? (
                  c.label
                ) : (
                  <button
                    onClick={() => onSort(c.key)}
                    className="inline-flex items-center gap-1 hover:text-foreground transition"
                  >
                    {c.label}
                    {sort?.key === c.key ? (
                      sort.dir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row, idx) => {
              const isBest = bestWorst.best === row;
              const isWorst = bestWorst.worst === row;
              return (
                <tr
                  key={idx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={[
                    "border-t border-border",
                    isBest ? "bg-[color:var(--chart-mint)]/8" : "",
                    isWorst ? "bg-[color:var(--chart-coral)]/8" : "",
                    !isBest && !isWorst ? "hover:bg-secondary/40" : "",
                    onRowClick ? "cursor-pointer" : "",
                  ].join(" ")}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={[
                        "px-4 py-2.5 whitespace-nowrap tabular-nums",
                        c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left",
                      ].join(" ")}
                    >
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
