"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { addWeight } from "@/lib/actions/wellness";
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
import { toLocalInputValue, localInputToUtc } from "@/lib/domain/time";
import { toast } from "@/lib/toast";

export function WeightForm() {
  const [open, setOpen] = useState(false);
  const [peso, setPeso] = useState("");
  const [medido, setMedido] = useState(toLocalInputValue());
  const [pending, start] = useTransition();

  function submit() {
    start(async () => {
      const r = await addWeight({ peso_kg: peso, medido_em: localInputToUtc(medido) });
      if (r.error) {
        toast(r.error, "error");
        return;
      }
      toast("Peso registrado.", "success");
      setPeso("");
      setMedido(toLocalInputValue());
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Plus /> Registrar peso
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar peso</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Peso (kg)" htmlFor="peso">
            <Input
              id="peso"
              inputMode="decimal"
              autoFocus
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="72,5"
            />
          </Field>
          <Field label="Medido em" htmlFor="medido">
            <Input id="medido" type="datetime-local" value={medido} onChange={(e) => setMedido(e.target.value)} />
          </Field>
          <div className="flex gap-3">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                Cancelar
              </Button>
            </DialogClose>
            <Button className="flex-1" onClick={submit} disabled={pending || !peso}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
