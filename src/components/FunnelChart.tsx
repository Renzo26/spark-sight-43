export interface FunnelStage {
  label: string;
  value: number;
}

// Gradiente verde da marca (escuro no topo → médio na base), garante texto branco legível.
const BAND_COLORS = [
  "#0f5132",
  "#15663f",
  "#1a7a4b",
  "#1f8d57",
  "#249c61",
  "#2bae6c",
];

function fmtCompacto(v: number): string {
  if (!isFinite(v)) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2).replace(".", ",")} mi`;
  if (v >= 10_000) return `${Math.round(v / 1000)} mil`;
  if (v >= 1_000) return `${(v / 1000).toFixed(1).replace(".", ",")} mil`;
  return new Intl.NumberFormat("pt-BR").format(v);
}

function fmtPctCompacto(v: number): string {
  return `${v.toFixed(1).replace(".", ",")}%`;
}

const W = 300; // largura do viewBox (espaço lateral p/ anotações)
const CX = W / 2;
const BAND_H = 40; // altura de cada faixa
const MAX_HALF = 104; // meia-largura do topo
const MIN_HALF = 34; // meia-largura da base

export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const n = stages.length;
  if (n === 0) return null;

  // Meia-largura por etapa (afunilamento suave por posição, mantendo silhueta de funil).
  const halfAt = (i: number) =>
    n === 1 ? MAX_HALF : MAX_HALF - (MAX_HALF - MIN_HALF) * (i / (n - 1));

  const totalH = n * BAND_H;
  const rimRy = 7;
  const viewH = totalH + rimRy;

  return (
    <svg
      viewBox={`0 0 ${W} ${viewH}`}
      width="100%"
      className="block mx-auto"
      style={{ maxHeight: 360 }}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Funil de tráfego"
    >
      {/* Boca do funil (elipse no topo) */}
      <ellipse cx={CX} cy={rimRy} rx={MAX_HALF} ry={rimRy} fill={BAND_COLORS[0]} opacity={0.55} />

      {stages.map((s, i) => {
        const topHalf = halfAt(i);
        const botHalf = i < n - 1 ? halfAt(i + 1) : topHalf * 0.78;
        const y0 = i * BAND_H + rimRy;
        const y1 = y0 + BAND_H;
        const color = BAND_COLORS[i % BAND_COLORS.length];

        const prev = stages[i - 1];
        const conv = prev && prev.value > 0 ? (s.value / prev.value) * 100 : null;

        const points = [
          `${CX - topHalf},${y0}`,
          `${CX + topHalf},${y0}`,
          `${CX + botHalf},${y1}`,
          `${CX - botHalf},${y1}`,
        ].join(" ");

        return (
          <g key={s.label}>
            <polygon points={points} fill={color} stroke="#ffffff" strokeOpacity={0.25} strokeWidth={1} />

            {/* Rótulo da etapa */}
            <text
              x={CX}
              y={y0 + 16}
              textAnchor="middle"
              fontSize={11}
              fill="#ffffff"
              fillOpacity={0.9}
            >
              {s.label}
            </text>
            {/* Valor */}
            <text
              x={CX}
              y={y0 + 31}
              textAnchor="middle"
              fontSize={15}
              fontWeight={700}
              fill="#ffffff"
            >
              {fmtCompacto(s.value)}
            </text>

            {/* Conversão vs. etapa anterior, à direita da faixa */}
            {conv != null && (
              <text
                x={CX + topHalf + 6}
                y={y0 + 22}
                textAnchor="start"
                fontSize={9}
                fill="var(--muted-foreground)"
              >
                ↓ {fmtPctCompacto(conv)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
