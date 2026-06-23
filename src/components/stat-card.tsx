import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  empty,
  emptyHint,
  href,
  accent = "primary",
  progress,
  footer,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | number;
  unit?: string;
  empty?: boolean;
  emptyHint?: string;
  href: string;
  accent?: "primary" | "water" | "protein" | "calorie" | "sleep";
  progress?: number;
  footer?: string;
}) {
  const accentVar =
    accent === "water"
      ? "var(--water)"
      : accent === "protein"
        ? "var(--protein)"
        : accent === "calorie"
          ? "var(--calorie)"
          : accent === "sleep"
            ? "var(--sleep)"
            : "var(--primary)";

  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
    >
      <div className="flex items-center justify-between">
        <div
          className="flex size-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `color-mix(in oklch, ${accentVar} 18%, transparent)`, color: accentVar }}
        >
          <Icon className="size-5" />
        </div>
        <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      {empty ? (
        <p className="text-sm font-medium text-muted-foreground">{emptyHint ?? "Sem registros hoje"}</p>
      ) : (
        <p className="flex items-baseline gap-1 text-2xl font-bold leading-none">
          {value}
          {unit ? <span className="text-sm font-medium text-muted-foreground">{unit}</span> : null}
        </p>
      )}
      {progress != null && !empty ? (
        <Progress value={progress * 100} color={accentVar} className="mt-1" />
      ) : null}
      {footer ? <p className="text-xs text-muted-foreground">{footer}</p> : null}
    </Link>
  );
}
