"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/rotina", label: "Rotina" },
  { href: "/treinos", label: "Cronômetro" },
];

export function TreinosTabs() {
  const pathname = usePathname();
  return (
    <div className="inline-flex w-full rounded-xl bg-muted p-1">
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium transition-colors",
              active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
