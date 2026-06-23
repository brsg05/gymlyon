"use client";

import { useState, useTransition } from "react";
import { Pencil, Power } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteButton } from "@/components/delete-button";
import { updateGoal, toggleGoal, deleteGoal } from "@/lib/actions/goals";
import { META_LABEL, META_UNIT } from "@/lib/domain/constants";
import { intf } from "@/lib/utils";
import { toast } from "@/lib/toast";
import type { Meta } from "@/lib/types";

export function GoalRow({
  meta,
  ratio,
  current,
  available,
}: {
  meta: Meta;
  ratio: number;
  current: number | null;
  available: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [valor, setValor] = useState(String(meta.valor_alvo));
  const [pending, start] = useTransition();
  const unit = META_UNIT[meta.tipo];

  function saveEdit() {
    const v = Number(valor.replace(",", "."));
    if (!(v > 0)) {
      toast("Valor inválido.", "error");
      return;
    }
    start(async () => {
      const r = await updateGoal(meta.id, v);
      if (r.error) toast(r.error, "error");
      else setEditing(false);
    });
  }

  function toggle() {
    start(async () => {
      const r = await toggleGoal(meta.id, !meta.ativa);
      if (r.error) toast(r.error, "error");
    });
  }

  return (
    <Card className={meta.ativa ? "" : "opacity-60"}>
      <CardContent className="flex flex-col gap-2 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{META_LABEL[meta.tipo]}</span>
            <Badge variant="muted">{meta.periodo === "diario" ? "Diário" : "Mensal"}</Badge>
            {!meta.ativa ? <Badge variant="outline">Inativa</Badge> : null}
          </div>
          <div className="flex items-center">
            <button
              type="button"
              aria-label="Editar"
              onClick={() => setEditing(true)}
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Ativar/desativar"
              disabled={pending}
              onClick={toggle}
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <Power className="size-4" />
            </button>
            <DeleteButton action={deleteGoal.bind(null, meta.id)} />
          </div>
        </div>
        <Progress value={ratio * 100} />
        <p className="text-xs text-muted-foreground">
          {available
            ? `${Math.round(ratio * 100)}% · ${intf(current ?? 0)} / ${intf(meta.valor_alvo)} ${unit}`
            : `Meta ${intf(meta.valor_alvo)} ${unit} · progresso indisponível`}
        </p>
      </CardContent>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar meta · {META_LABEL[meta.tipo]}</DialogTitle>
          </DialogHeader>
          <Field label={`Valor alvo (${unit})`} htmlFor="ev">
            <Input id="ev" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} />
          </Field>
          <div className="flex gap-3">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                Cancelar
              </Button>
            </DialogClose>
            <Button className="flex-1" onClick={saveEdit} disabled={pending}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
