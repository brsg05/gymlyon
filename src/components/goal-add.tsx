"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createGoal } from "@/lib/actions/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { META_LABEL, META_UNIT } from "@/lib/domain/constants";
import { toast } from "@/lib/toast";
import type { MetaTipo, Periodo } from "@/lib/types";

const TIPOS: MetaTipo[] = ["agua", "proteina", "deficit_calorico", "sono", "peso"];

export function GoalAdd() {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<MetaTipo>("agua");
  const [periodo, setPeriodo] = useState<Periodo>("diario");
  const [valor, setValor] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    const v = Number(valor.replace(",", "."));
    if (!(v > 0)) {
      toast("Informe um valor válido.", "error");
      return;
    }
    start(async () => {
      const r = await createGoal({ tipo, valor_alvo: v, periodo });
      if (r.error) {
        toast(r.error, "error");
        return;
      }
      toast("Meta criada.", "success");
      setValor("");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Plus /> Nova meta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova meta</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Tipo">
            <Select value={tipo} onValueChange={(v) => setTipo(v as MetaTipo)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {META_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Período">
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diario">Diário</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={`Valor alvo (${META_UNIT[tipo]})`} htmlFor="valor">
            <Input id="valor" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0" />
          </Field>
          <div className="flex gap-3">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                Cancelar
              </Button>
            </DialogClose>
            <Button className="flex-1" onClick={submit} disabled={pending}>
              Criar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
