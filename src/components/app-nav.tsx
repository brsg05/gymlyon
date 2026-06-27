"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, Dumbbell, Target, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Hoje", icon: Home, match: ["/dashboard"] },
  { href: "/alimentacao", label: "Refeições", icon: UtensilsCrossed, match: ["/alimentacao"] },
  { href: "/rotina", label: "Treinos", icon: Dumbbell, match: ["/rotina", "/treinos"] },
  { href: "/metas", label: "Metas", icon: Target, match: ["/metas"] },
  { href: "/mais", label: "Mais", icon: Menu, match: ["/mais"] },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-40 border-t bg-card/95 backdrop-blur safe-bottom">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1.5">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match.some((m) => pathname === m || pathname.startsWith(m + "/"));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "tap flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("size-6", active && "fill-primary/10")} strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
