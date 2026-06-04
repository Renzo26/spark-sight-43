import { fmtInt, fmtPct } from "@/utils/metrics";

export interface FunnelStage {
  label: string;
  value: number;
}

const STAGE_COLORS = [
  "var(--chart-blue)",
  "var(--chart-lilac)",
  "var(--chart-mint)",
  "var(--chart-yellow)",
  "var(--chart-coral)",
  "var(--primary)",
];

export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const top = stages[0]?.value || 1;

  return (
    <div className="flex flex-col gap-2">
      {stages.map((s, i) => {
        const widthPct = Math.max(8, (s.value / top) * 100);
        const next = stages[i + 1];
        const conv = next && s.value > 0 ? (next.value / s.value) * 100 : null;
        const color = STAGE_COLORS[i % STAGE_COLORS.length];
        return (
          <div key={s.label}>
            <div className="flex items-center gap-3">
              <div className="w-24 text-xs text-muted-foreground shrink-0">{s.label}</div>
              <div className="flex-1 relative h-9 bg-secondary rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg flex items-center justify-end pr-3 text-xs font-semibold text-foreground transition-all"
                  style={{
                    width: `${widthPct}%`,
                    background: `linear-gradient(90deg, ${color}1f, ${color}55)`,
                    borderRight: `3px solid ${color}`,
                  }}
                >
                  <span className="tabular-nums">{fmtInt(s.value)}</span>
                </div>
              </div>
            </div>
            {conv != null && (
              <div className="ml-24 pl-3 mt-0.5 mb-0.5 text-[10px] text-muted-foreground">
                ↓ conv. {fmtPct(conv)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
