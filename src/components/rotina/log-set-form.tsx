"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { logSet } from "@/lib/actions/rotina";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";

function num(v: string): number | null {
  const s = v.trim().replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function LogSetForm({ exercicioId, dia }: { exercicioId: string; dia: number }) {
  const [series, setSeries] = useState("1");
  const [reps, setReps] = useState("");
  const [peso, setPeso] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    const s = num(series);
    const r = num(reps);
    const p = num(peso) ?? 0;
    if (!s || !r) {
      toast("Preencha séries e repetições.", "error");
      return;
    }
    start(async () => {
      const res = await logSet({ exercicio_id: exercicioId, dia_semana: dia, series: s, repeticoes: r, peso_kg: p });
      if (res.error) {
        toast(res.error, "error");
        return;
      }
      setReps("");
      setPeso("");
      toast("Série registrada.", "success");
    });
  }

  return (
    <div className="flex items-end gap-2">
      <Labeled label="Séries">
        <Input inputMode="numeric" value={series} onChange={(e) => setSeries(e.target.value)} className="h-10 px-2 text-center" />
      </Labeled>
      <span className="pb-2.5 text-muted-foreground">×</span>
      <Labeled label="Reps">
        <Input inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="10" className="h-10 px-2 text-center" />
      </Labeled>
      <Labeled label="Peso (kg)">
        <Input inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="0" className="h-10 px-2 text-center" />
      </Labeled>
      <Button size="icon" className="size-10 shrink-0" onClick={submit} disabled={pending} aria-label="Registrar série">
        <Plus />
      </Button>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-1 flex-col gap-1">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
