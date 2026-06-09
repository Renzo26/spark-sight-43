import type { ReactNode } from "react";

export function ChartCard({
  title, subtitle, action, children, className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "card-rise rounded-2xl bg-card border border-border p-5",
        "shadow-[var(--shadow-card)]",
        className,
      ].join(" ")}
    >
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display text-sm font-bold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
