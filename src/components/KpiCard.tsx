import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export type AccentColor = "blue" | "mint" | "lilac" | "coral" | "yellow";

const ACCENTS: Record<AccentColor, { fill: string; bg: string; text: string }> = {
  blue:   { fill: "var(--chart-blue)",   bg: "bg-[color:var(--chart-blue)]/10",   text: "text-[color:var(--chart-blue)]" },
  mint:   { fill: "var(--chart-mint)",   bg: "bg-[color:var(--chart-mint)]/10",   text: "text-[color:var(--chart-mint)]" },
  lilac:  { fill: "var(--chart-lilac)",  bg: "bg-[color:var(--chart-lilac)]/10",  text: "text-[color:var(--chart-lilac)]" },
  coral:  { fill: "var(--chart-coral)",  bg: "bg-[color:var(--chart-coral)]/10",  text: "text-[color:var(--chart-coral)]" },
  yellow: { fill: "var(--chart-yellow)", bg: "bg-[color:var(--chart-yellow)]/15", text: "text-[color:var(--chart-yellow)]" },
};

export interface KpiCardProps {
  title: string;
  value: string;
  hint?: string;
  delta?: number; // percentual; positivo = bom, negativo = ruim (use deltaInverse para inverter)
  deltaInverse?: boolean;
  series?: number[];
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  accent?: AccentColor;
}

export function KpiCard({
  title, value, hint, delta, deltaInverse, series, icon: Icon, accent = "blue",
}: KpiCardProps) {
  const a = ACCENTS[accent];
  const isUp = (delta ?? 0) >= 0;
  const positive = deltaInverse ? !isUp : isUp;
  const data = (series ?? []).map((v, i) => ({ i, v }));
  const gradId = `g-${accent}-${title.replace(/\s/g, "")}`;

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] flex flex-col">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.bg}`}>
              <Icon className={`w-4 h-4 ${a.text}`} />
            </div>
          )}
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
        </div>
        {delta != null && isFinite(delta) && (
          <span
            className={[
              "inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md",
              positive ? "text-success bg-success/10" : "text-danger bg-danger/10",
            ].join(" ")}
          >
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>

      <div className="mt-3 text-2xl font-bold tracking-tight text-foreground tabular-nums">
        {value}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}

      {data.length > 1 && (
        <div className="mt-3 h-12 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={a.fill} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={a.fill} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={a.fill}
                strokeWidth={2}
                fill={`url(#${gradId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
