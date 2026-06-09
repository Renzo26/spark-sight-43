import { useState } from "react";
import { Menu } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks, SidebarBrand, HEADER_BG } from "@/components/Sidebar";

export function MobileTopBar() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 text-white px-4 h-14"
      style={{ background: HEADER_BG, borderBottom: "3px solid var(--brand-yellow)" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex items-center justify-center h-9 w-9 rounded-lg bg-white p-1 shrink-0">
          <img src="/logo-wnbf-brazil.png" alt="WNBF Brazil" className="h-full w-full object-contain" />
        </span>
        <span className="text-sm font-semibold truncate">WNBF Brazil</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="Abrir menu"
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/20 bg-white/10 text-white"
        >
          <Menu className="w-5 h-5" />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 bg-sidebar">
          <SidebarBrand />

          <NavLinks onNavigate={() => setOpen(false)} />

          <div className="mt-6 px-5 flex items-center gap-2">
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
        </SheetContent>
      </Sheet>
    </div>
  );
}
