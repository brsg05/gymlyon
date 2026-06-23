"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { addSleep } from "@/lib/actions/wellness";
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
import { QUALIDADE_LABEL } from "@/lib/domain/constants";
import { toLocalInputValue, localInputValueHoursAgo, localInputToUtc, hoursBetween } from "@/lib/domain/time";
import { toast } from "@/lib/toast";
import { cn, nf } from "@/lib/utils";

export function SleepForm() {
  const [open, setOpen] = useState(false);
  const [deitar, setDeitar] = useState(() => localInputValueHoursAgo(8));
  const [acordar, setAcordar] = useState(toLocalInputValue());
  const [qualidade, setQualidade] = useState(3);
  const [pending, start] = useTransition();

  const horas =
    deitar && acordar && new Date(acordar) > new Date(deitar)
      ? hoursBetween(localInputToUtc(deitar), localInputToUtc(acordar))
      : null;

  function submit() {
    start(async () => {
      const r = await addSleep({
        deitar_em: localInputToUtc(deitar),
        acordar_em: localInputToUtc(acordar),
        qualidade,
      });
      if (r.error) {
        toast(r.error, "error");
        return;
      }
      toast("Sono registrado.", "success");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Plus /> Registrar sono
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar sono</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Deitar" htmlFor="deitar">
            <Input id="deitar" type="datetime-local" value={deitar} onChange={(e) => setDeitar(e.target.value)} />
          </Field>
          <Field label="Acordar" htmlFor="acordar">
            <Input id="acordar" type="datetime-local" value={acordar} onChange={(e) => setAcordar(e.target.value)} />
          </Field>
          {horas != null ? (
            <p className="text-sm text-muted-foreground">
              Duração: <span className="font-medium text-foreground">{nf(horas, 1)} h</span>
            </p>
          ) : null}
          <Field label="Qualidade">
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQualidade(q)}
                  className={cn(
                    "tap rounded-lg border px-1 py-2 text-[11px] font-medium leading-tight transition-colors",
                    qualidade === q ? "border-[var(--sleep)] bg-[var(--sleep)]/15 text-foreground" : "bg-card hover:bg-muted",
                  )}
                >
                  {QUALIDADE_LABEL[q]}
                </button>
              ))}
            </div>
          </Field>
          <div className="flex gap-3">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                Cancelar
              </Button>
            </DialogClose>
            <Button className="flex-1" onClick={submit} disabled={pending || horas == null}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
