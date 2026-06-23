"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteTraining } from "@/lib/actions/training";
import { toast } from "@/lib/toast";

export function DeleteTraining({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label="Excluir treino"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await deleteTraining(id);
          if (r.error) {
            toast(r.error, "error");
            return;
          }
          toast("Treino excluído.", "success");
          router.push("/treinos");
          router.refresh();
        })
      }
      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
    >
      {pending ? <Loader2 className="size-5 animate-spin" /> : <Trash2 className="size-5" />}
    </button>
  );
}
