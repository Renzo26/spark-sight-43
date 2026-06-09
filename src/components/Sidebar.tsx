import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Table2, Radio } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

interface Item {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const HEADER_BG = "var(--header-gradient)"; // gradiente verde→azul (bandeira)
// Altura da faixa superior: h-20 (mantenha igual no header — ver FilterBar).

export const NAV_ITEMS: Item[] = [
  { to: "/", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/detalhamento", label: "Detalhamento", icon: Table2 },
  { to: "/midia", label: "Mídia", icon: Radio },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="p-3 flex flex-col gap-1">
      {NAV_ITEMS.map((it) => {
        const active = pathname === it.to;
        const Icon = it.icon;
        return (
          <Link
            key={it.to}
            to={it.to}
            onClick={onNavigate}
            className={[
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
              active
                ? "bg-primary text-primary-foreground font-semibold shadow-[0_8px_20px_-10px_rgba(0,145,63,0.7)]"
                : "text-sidebar-foreground hover:bg-secondary hover:translate-x-0.5",
            ].join(" ")}
          >
            <Icon className="w-4 h-4" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Cabeçalho da sidebar (logo) — reutilizado na sidebar e no drawer mobile. */
export function SidebarBrand() {
  return (
    <div className="flex items-center gap-3 px-5 h-32 border-b border-sidebar-border bg-sidebar">
      <img
        src="/logo-wnbf-brazil.png"
        alt="WNBF Brazil"
        className="h-16 w-16 object-contain shrink-0"
      />
      <div>
        <div className="font-display text-base font-extrabold leading-tight text-foreground">
          WNBF Brazil
        </div>
        <div className="text-[11px] text-muted-foreground">Dashboard de Tráfego</div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col bg-sidebar">
      <SidebarBrand />

      {/* Corpo branco: o separador vertical fica só aqui (não cruza a faixa escura) */}
      <div className="flex flex-1 flex-col border-r border-sidebar-border">
        <NavLinks />

        <div className="mt-auto p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-10 w-10 rounded-xl border border-border bg-card p-1 shrink-0">
              <img
                src="/logo-evento.png"
                alt="Natural Fitness & Health Expo 2026"
                className="h-full w-full object-contain"
              />
            </span>
            <div className="text-[11px] leading-tight text-muted-foreground">
              <div className="font-medium text-foreground">Natural Fitness</div>
              &amp; Health Expo 2026
            </div>
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground">v1.0 · Lançamento</div>
        </div>
      </div>
    </aside>
  );
}
