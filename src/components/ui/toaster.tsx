"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import { subscribe, dismiss, type ToastItem } from "@/lib/toast";
import { cn } from "@/lib/utils";

const icons = {
  default: Info,
  success: CheckCircle2,
  error: XCircle,
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => subscribe(setItems), []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
      {items.map((t) => {
        const Icon = icons[t.variant];
        return (
          <button
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl border bg-card px-4 py-3 text-sm font-medium shadow-lg",
              t.variant === "success" && "border-primary/40 text-foreground",
              t.variant === "error" && "border-destructive/40 text-foreground",
            )}
          >
            <Icon
              className={cn(
                "size-5 shrink-0",
                t.variant === "success" && "text-primary",
                t.variant === "error" && "text-destructive",
                t.variant === "default" && "text-muted-foreground",
              )}
            />
            <span className="text-left">{t.message}</span>
          </button>
        );
      })}
    </div>
  );
}
