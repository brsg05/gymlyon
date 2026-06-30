"use client";

import { useState, useTransition } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { updateExercise } from "@/lib/actions/rotina";
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

export function EditExercise({
  id,
  nome: nomeInicial,
  grupo: grupoInicial,
  grupos,
}: {
  id: string;
  nome: string;
  grupo: string | null;
  grupos: string[];
}) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(nomeInicial);
  const [grupo, setGrupo] = useState(grupoInicial ?? "");
  const [pending, start] = useTransition();

  function save() {
    if (!nome.trim()) {
      toast("Informe o nome.", "error");
      return;
    }
    start(async () => {
      const r = await updateExercise(id, { nome, grupo_muscular: grupo || null });
      if (r.error) {
        toast(r.error, "error");
        return;
      }
      toast("Exercício atualizado.", "success");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Editar exercício"
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <Pencil className="size-4" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar exercício</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Nome" htmlFor="edexnome">
            <Input id="edexnome" autoFocus value={nome} onChange={(e) => setNome(e.target.value)} />
          </Field>
          <Field label="Grupo muscular (opcional)" htmlFor="edexgrupo">
            <Input
              id="edexgrupo"
              list="grupos-edit"
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              placeholder="Ex.: Bíceps"
            />
            <datalist id="grupos-edit">
              {grupos.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </Field>
          <div className="flex gap-3">
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
