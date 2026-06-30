"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateSet, deleteSet } from "@/lib/actions/rotina";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import { cn, nf } from "@/lib/utils";

function num(v: string): number | null {
  const s = v.trim().replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function SetChip({
  set,
  highlight,
}: {
  set: { id: string; series: number; repeticoes: number; peso_kg: number; data_referencia: string };
  highlight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(set.data_referencia);
  const [series, setSeries] = useState(String(set.series));
  const [reps, setReps] = useState(String(set.repeticoes));
  const [peso, setPeso] = useState(String(set.peso_kg));
  const [pending, start] = useTransition();

  function save() {
    const s = num(series);
    const r = num(reps);
    const p = num(peso) ?? 0;
    if (!s || !r) {
      toast("Preencha séries e repetições.", "error");
      return;
    }
    start(async () => {
      const res = await updateSet(set.id, { series: s, repeticoes: r, peso_kg: p, data_referencia: data });
      if (res.error) {
        toast(res.error, "error");
        return;
      }
      toast("Série atualizada.", "success");
      setOpen(false);
    });
  }

  function remove() {
    start(async () => {
      const res = await deleteSet(set.id);
      if (res.error) {
        toast(res.error, "error");
        return;
      }
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-medium shadow-sm transition-colors hover:opacity-80",
          highlight ? "bg-card" : "bg-card/70",
        )}
      >
        {set.series}×{set.repeticoes} · {nf(set.peso_kg, 1)} kg
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar série</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Data" htmlFor="setdata">
            <Input id="setdata" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Séries" htmlFor="setser">
              <Input id="setser" inputMode="numeric" value={series} onChange={(e) => setSeries(e.target.value)} className="text-center" />
            </Field>
            <Field label="Reps" htmlFor="setrep">
              <Input id="setrep" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} className="text-center" />
            </Field>
            <Field label="Peso (kg)" htmlFor="setpeso">
              <Input id="setpeso" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} className="text-center" />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 text-destructive" onClick={remove} disabled={pending}>
              Excluir
            </Button>
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                Cancelar
              </Button>
            </DialogClose>
            <Button className="flex-1" onClick={save} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
