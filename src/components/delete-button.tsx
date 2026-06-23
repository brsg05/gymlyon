"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function DeleteButton({
  action,
  className,
  label = "Excluir",
}: {
  action: () => Promise<{ error?: string }>;
  className?: string;
  label?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={label}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await action();
          if (r?.error) toast(r.error, "error");
        })
      }
      className={cn(
        "flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50",
        className,
      )}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  );
}
