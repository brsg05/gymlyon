"use client";

import { useTransition } from "react";
import { Plus } from "lucide-react";
import { addWater } from "@/lib/actions/wellness";
import { WATER_PRESETS } from "@/lib/domain/constants";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function QuickWater({ className }: { className?: string }) {
  const [pending, start] = useTransition();

  function add(ml: number) {
    start(async () => {
      const r = await addWater(ml);
      if (r.error) toast(r.error, "error");
      else toast(`+${ml >= 1000 ? "1 L" : ml + " ml"} de água`, "success");
    });
  }

  return (
    <div className={cn("grid grid-cols-4 gap-2", className)}>
      {WATER_PRESETS.map((ml) => (
        <button
          key={ml}
          type="button"
          disabled={pending}
          onClick={() => add(ml)}
          className="tap flex flex-col items-center justify-center gap-0.5 rounded-xl border bg-card py-2.5 text-sm font-semibold shadow-sm transition-colors hover:bg-muted active:scale-[0.97] disabled:opacity-60"
        >
          <Plus className="size-4 text-[var(--water)]" />
          {ml >= 1000 ? "1 L" : `${ml}`}
          {ml < 1000 ? <span className="text-[10px] font-normal text-muted-foreground">ml</span> : null}
        </button>
      ))}
    </div>
  );
}
