import type { MetaRow } from "@/types/sheets";
import { fmtBRL, fmtInt } from "@/utils/metrics";

/**
 * Gráfico de metas em combinação empilhada: para cada métrica mostra o
 * realizado preenchido sobre a faixa até o Ideal e até o Máximo de referência.
 */
export function MetasChart({ metas }: { metas: MetaRow[] }) {
  const fmt = (v: number, f: MetaRow["formato"]) => (f === "brl" ? fmtBRL(v) : fmtInt(v));

  return (
    <div className="space-y-5">
      {metas.map((m) => {
        const escala = Math.max(m.maximo, m.realizado, 1);
        const pReal = Math.min((m.realizado / escala) * 100, 100);
        const pIdeal = Math.min((m.ideal / escala) * 100, 100);
        const pMax = Math.min((m.maximo / escala) * 100, 100);
        const atingiuIdeal = m.realizado >= m.ideal;

        return (
          <div key={m.metrica}>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xs font-semibold text-foreground">{m.metrica}</span>
              <span className="text-xs tabular-nums">
                <span className="font-bold text-foreground">{fmt(m.realizado, m.formato)}</span>
                <span className="text-muted-foreground"> / ideal {fmt(m.ideal, m.formato)}</span>
              </span>
            </div>

            <div className="relative h-6 w-full rounded-lg bg-secondary overflow-visible">
              {/* faixa empilhada: até o máximo (referência mais clara) */}
              <div
                className="absolute inset-y-0 left-0 rounded-lg"
                style={{
                  width: `${pMax}%`,
                  background: "color-mix(in srgb, var(--chart-blue) 12%, transparent)",
                }}
              />
              {/* realizado */}
              <div
                className="absolute inset-y-0 left-0 rounded-lg transition-all"
                style={{
                  width: `${pReal}%`,
                  background: atingiuIdeal ? "var(--chart-mint)" : "var(--chart-blue)",
                }}
              />
              {/* marcador Ideal */}
              <Marcador
                pos={pIdeal}
                cor="var(--chart-lilac)"
                titulo={`Ideal: ${fmt(m.ideal, m.formato)}`}
              />
              {/* marcador Máximo */}
              <Marcador
                pos={pMax}
                cor="var(--chart-coral)"
                titulo={`Máximo: ${fmt(m.maximo, m.formato)}`}
              />
            </div>

            <div className="flex justify-end gap-3 mt-1 text-[10px] text-muted-foreground">
              <Legenda cor="var(--chart-lilac)" label={`Ideal ${fmt(m.ideal, m.formato)}`} />
              <Legenda cor="var(--chart-coral)" label={`Máximo ${fmt(m.maximo, m.formato)}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Marcador({ pos, cor, titulo }: { pos: number; cor: string; titulo: string }) {
  return (
    <div
      className="absolute -top-0.5 -bottom-0.5 w-[2px]"
      style={{ left: `calc(${pos}% - 1px)`, background: cor }}
      title={titulo}
    />
  );
}

function Legenda({ cor, label }: { cor: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-block w-2 h-2 rounded-sm" style={{ background: cor }} />
      {label}
    </span>
  );
}
