"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Search, ChevronLeft, Check } from "lucide-react";
import { addRoutineExercise, createExerciseForRoutine } from "@/lib/actions/rotina";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";

type Ex = { id: string; nome: string; grupo_muscular: string | null };

export function AddRoutineExercise({
  dia,
  exercicios,
  existingIds,
}: {
  dia: number;
  exercicios: Ex[];
  existingIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"pick" | "create">("pick");
  const [query, setQuery] = useState("");
  const [newEx, setNewEx] = useState({ nome: "", grupo: "" });
  const [pending, start] = useTransition();
  const present = new Set(existingIds);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? exercicios.filter((e) => e.nome.toLowerCase().includes(q)) : exercicios;
  }, [query, exercicios]);

  const grupos = useMemo(
    () =>
      [...new Set(exercicios.map((e) => e.grupo_muscular).filter((g): g is string => !!g))].sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    [exercicios],
  );

  function reset() {
    setMode("pick");
    setQuery("");
    setNewEx({ nome: "", grupo: "" });
  }

  function add(exId: string) {
    start(async () => {
      const r = await addRoutineExercise(dia, exId);
      if (r.error) {
        toast(r.error, "error");
        return;
      }
      toast("Exercício adicionado ao dia.", "success");
      setOpen(false);
      reset();
    });
  }

  function create() {
    if (!newEx.nome.trim()) return;
    start(async () => {
      const r = await createExerciseForRoutine(dia, { nome: newEx.nome, grupo_muscular: newEx.grupo || null });
      if (r.error) {
        toast(r.error, "error");
        return;
      }
      toast("Exercício criado e adicionado.", "success");
      setOpen(false);
      reset();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Plus /> Adicionar exercício ao dia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "create" ? (
              <button type="button" onClick={() => setMode("pick")} aria-label="Voltar">
                <ChevronLeft className="size-5" />
              </button>
            ) : null}
            {mode === "create" ? "Novo exercício" : "Adicionar ao dia"}
          </DialogTitle>
        </DialogHeader>

        {mode === "pick" ? (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar exercício"
                className="pl-9"
              />
            </div>
            <div className="-mx-1 max-h-[44vh] overflow-y-auto px-1">
              <ul className="flex flex-col gap-1">
                {filtered.map((e) => {
                  const added = present.has(e.id);
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        disabled={added || pending}
                        onClick={() => add(e.id)}
                        className="flex w-full items-center justify-between rounded-lg border bg-card px-3 py-2.5 text-left hover:bg-muted disabled:opacity-50"
                      >
                        <span className="font-medium">{e.nome}</span>
                        {added ? (
                          <Check className="size-4 text-primary" />
                        ) : e.grupo_muscular ? (
                          <span className="text-xs text-muted-foreground">{e.grupo_muscular}</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
                {filtered.length === 0 ? (
                  <li className="py-4 text-center text-sm text-muted-foreground">Nenhum exercício encontrado.</li>
                ) : null}
              </ul>
            </div>
            <Button variant="outline" onClick={() => setMode("create")}>
              <Plus /> Criar novo exercício
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Field label="Nome" htmlFor="rexnome">
              <Input
                id="rexnome"
                autoFocus
                value={newEx.nome}
                onChange={(e) => setNewEx((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Ex.: Rosca scott"
              />
            </Field>
            <Field label="Grupo muscular (opcional)" htmlFor="rexgrupo">
              <Input
                id="rexgrupo"
                list="grupos-rotina"
                value={newEx.grupo}
                onChange={(e) => setNewEx((p) => ({ ...p, grupo: e.target.value }))}
                placeholder="Ex.: Bíceps"
              />
              <datalist id="grupos-rotina">
                {grupos.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </Field>
            <Button onClick={create} disabled={pending || !newEx.nome.trim()}>
              Criar e adicionar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
