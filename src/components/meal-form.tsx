"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { addMeal } from "@/lib/actions/wellness";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";

function num(v: string): number | null {
  const s = v.trim().replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function MealForm() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ nome: "", calorias: "", peso_g: "", proteina_g: "", carboidrato_g: "", gordura_g: "" });
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  function submit() {
    start(async () => {
      const r = await addMeal({
        nome: f.nome,
        calorias: num(f.calorias),
        peso_g: num(f.peso_g),
        proteina_g: num(f.proteina_g),
        carboidrato_g: num(f.carboidrato_g),
        gordura_g: num(f.gordura_g),
      });
      if (r.error) {
        toast(r.error, "error");
        return;
      }
      toast("Refeição adicionada.", "success");
      setF({ nome: "", calorias: "", peso_g: "", proteina_g: "", carboidrato_g: "", gordura_g: "" });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Plus /> Adicionar refeição
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova refeição</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Nome" htmlFor="nome">
            <Input id="nome" autoFocus value={f.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex.: Almoço" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Calorias (kcal)" htmlFor="cal">
              <Input id="cal" inputMode="numeric" value={f.calorias} onChange={(e) => set("calorias", e.target.value)} placeholder="opcional" />
            </Field>
            <Field label="Peso (g)" htmlFor="pg">
              <Input id="pg" inputMode="numeric" value={f.peso_g} onChange={(e) => set("peso_g", e.target.value)} placeholder="opcional" />
            </Field>
            <Field label="Proteína (g)" htmlFor="prot">
              <Input id="prot" inputMode="decimal" value={f.proteina_g} onChange={(e) => set("proteina_g", e.target.value)} placeholder="opcional" />
            </Field>
            <Field label="Carboidrato (g)" htmlFor="carb">
              <Input id="carb" inputMode="decimal" value={f.carboidrato_g} onChange={(e) => set("carboidrato_g", e.target.value)} placeholder="opcional" />
            </Field>
            <Field label="Gordura (g)" htmlFor="gord">
              <Input id="gord" inputMode="decimal" value={f.gordura_g} onChange={(e) => set("gordura_g", e.target.value)} placeholder="opcional" />
            </Field>
          </div>
          <div className="flex gap-3">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                Cancelar
              </Button>
            </DialogClose>
            <Button className="flex-1" onClick={submit} disabled={pending || !f.nome.trim()}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
