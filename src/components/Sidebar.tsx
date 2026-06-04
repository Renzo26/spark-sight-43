import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Table2, Radio, Zap } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

interface Item {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const ITEMS: Item[] = [
  { to: "/", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/detalhamento", label: "Detalhamento", icon: Table2 },
  { to: "/midia", label: "Mídia", icon: Radio },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground leading-tight">WNBF Brazil</div>
          <div className="text-[11px] text-muted-foreground">Tráfego pago</div>
        </div>
      </div>
      <nav className="p-3 flex flex-col gap-1">
        {ITEMS.map((it) => {
          const active = pathname === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-sidebar-foreground hover:bg-secondary",
              ].join(" ")}
            >
              <Icon className="w-4 h-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-4 text-[11px] text-muted-foreground">
        v1.0 · Dashboard de Lançamento
      </div>
    </aside>
  );
}
