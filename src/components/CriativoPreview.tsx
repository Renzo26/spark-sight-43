import { Film, Image as ImageIcon, Images, MessageSquareQuote, Video } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { fmtBRL, fmtInt } from "@/utils/metrics";
import type { CriativoAgg } from "@/utils/metrics";

interface Formato {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  color: string;
}

function detectarFormato(nome: string): Formato {
  const n = nome.toLowerCase();
  if (n.includes("vsl") || n.includes("video") || n.includes("vídeo"))
    return { label: "Vídeo (VSL)", icon: Video, color: "var(--chart-blue)" };
  if (n.includes("reels")) return { label: "Reels", icon: Film, color: "var(--chart-lilac)" };
  if (n.includes("carrossel"))
    return { label: "Carrossel", icon: Images, color: "var(--chart-mint)" };
  if (n.includes("depoimento"))
    return { label: "Depoimento", icon: MessageSquareQuote, color: "var(--chart-coral)" };
  return { label: "Imagem estática", icon: ImageIcon, color: "var(--chart-yellow)" };
}

export function CriativoPreview({
  criativo,
  open,
  onOpenChange,
}: {
  criativo: CriativoAgg | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fmt = criativo ? detectarFormato(criativo.criativo) : null;
  const Icon = fmt?.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="pr-6">{criativo?.criativo ?? "Criativo"}</DialogTitle>
          <DialogDescription>{fmt?.label ?? "Pré-visualização do anúncio"}</DialogDescription>
        </DialogHeader>

        {/* Thumbnail */}
        <div
          className="relative aspect-video w-full overflow-hidden rounded-xl border border-border flex items-center justify-center"
          style={{
            background: fmt
              ? `linear-gradient(135deg, ${fmt.color}22, ${fmt.color}55)`
              : "var(--secondary)",
          }}
        >
          {criativo?.previewUrl ? (
            <img
              src={criativo.previewUrl}
              alt={criativo.criativo}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-center px-4">
              {Icon && (
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: fmt ? `${fmt.color}33` : "var(--card)" }}
                >
                  <Icon className="w-7 h-7" style={{ color: fmt?.color }} />
                </div>
              )}
              <span className="text-xs text-muted-foreground">Pré-visualização não disponível</span>
            </div>
          )}
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Investimento" value={fmtBRL(criativo?.investimento)} />
          <Metric label="Leads" value={fmtInt(criativo?.leads)} />
          <Metric label="CPL" value={fmtBRL(criativo?.cpl ?? undefined)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-bold text-foreground tabular-nums">{value}</div>
    </div>
  );
}
