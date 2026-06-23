"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Search, ChevronLeft } from "lucide-react";
import { addCard, createExercise } from "@/lib/actions/training";
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

function num(v: string): number | null {
  const s = v.trim().replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function ExerciseCardForm({
  treinoId,
  exercicios,
  nextOrdem,
}: {
  treinoId: string;
  exercicios: Ex[];
  nextOrdem: number;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"pick" | "create" | "fill">("pick");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Ex | null>(null);
  const [list, setList] = useState<Ex[]>(exercicios);
  const [newEx, setNewEx] = useState({ nome: "", grupo: "" });
  const [card, setCard] = useState({ peso: "", series: "3", reps: "10", descanso: "", obs: "" });
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? list.filter((e) => e.nome.toLowerCase().includes(q)) : list;
  }, [query, list]);

  function reset() {
    setMode("pick");
    setQuery("");
    setSelected(null);
    setNewEx({ nome: "", grupo: "" });
    setCard({ peso: "", series: "3", reps: "10", descanso: "", obs: "" });
  }

  function pick(e: Ex) {
    setSelected(e);
    setMode("fill");
  }

  function create() {
    if (!newEx.nome.trim()) return;
    start(async () => {
      const r = await createExercise({ nome: newEx.nome, grupo_muscular: newEx.grupo || null });
      if (r.error || !r.data) {
        toast(r.error ?? "Erro.", "error");
        return;
      }
      const created: Ex = { id: r.data.id, nome: newEx.nome.trim(), grupo_muscular: newEx.grupo || null };
      setList((l) => [created, ...l]);
      pick(created);
    });
  }

  function saveCard() {
    if (!selected) return;
    const series = num(card.series);
    const reps = num(card.reps);
    if (!series || !reps) {
      toast("Séries e repetições são obrigatórias.", "error");
      return;
    }
    start(async () => {
      const r = await addCard({
        treino_id: treinoId,
        exercicio_id: selected.id,
        peso_kg: num(card.peso) ?? 0,
        series,
        repeticoes: reps,
        descanso_segundos: num(card.descanso),
        observacao: card.obs || null,
        ordem: nextOrdem,
      });
      if (r.error) {
        toast(r.error, "error");
        return;
      }
      toast("Exercício adicionado.", "success");
      reset();
      setOpen(false);
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
          <Plus /> Adicionar exercício
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode !== "pick" ? (
              <button type="button" onClick={() => setMode("pick")} aria-label="Voltar">
                <ChevronLeft className="size-5" />
              </button>
            ) : null}
            {mode === "fill" && selected ? selected.nome : mode === "create" ? "Novo exercício" : "Escolher exercício"}
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
                {filtered.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => pick(e)}
                      className="flex w-full items-center justify-between rounded-lg border bg-card px-3 py-2.5 text-left hover:bg-muted"
                    >
                      <span className="font-medium">{e.nome}</span>
                      {e.grupo_muscular ? (
                        <span className="text-xs text-muted-foreground">{e.grupo_muscular}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
                {filtered.length === 0 ? (
                  <li className="py-4 text-center text-sm text-muted-foreground">Nenhum exercício encontrado.</li>
                ) : null}
              </ul>
            </div>
            <Button variant="outline" onClick={() => setMode("create")}>
              <Plus /> Criar novo exercício
            </Button>
          </div>
        ) : null}

        {mode === "create" ? (
          <div className="flex flex-col gap-4">
            <Field label="Nome" htmlFor="exnome">
              <Input id="exnome" autoFocus value={newEx.nome} onChange={(e) => setNewEx((p) => ({ ...p, nome: e.target.value }))} placeholder="Ex.: Supino inclinado" />
            </Field>
            <Field label="Grupo muscular (opcional)" htmlFor="exgrupo">
              <Input id="exgrupo" value={newEx.grupo} onChange={(e) => setNewEx((p) => ({ ...p, grupo: e.target.value }))} placeholder="Ex.: Peito" />
            </Field>
            <Button onClick={create} disabled={pending || !newEx.nome.trim()}>
              Criar e continuar
            </Button>
          </div>
        ) : null}

        {mode === "fill" && selected ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Peso (kg)" htmlFor="cpeso">
                <Input id="cpeso" inputMode="decimal" value={card.peso} onChange={(e) => setCard((p) => ({ ...p, peso: e.target.value }))} placeholder="0" />
              </Field>
              <Field label="Descanso (s)" htmlFor="cdesc">
                <Input id="cdesc" inputMode="numeric" value={card.descanso} onChange={(e) => setCard((p) => ({ ...p, descanso: e.target.value }))} placeholder="opcional" />
              </Field>
              <Field label="Séries" htmlFor="cser">
                <Input id="cser" inputMode="numeric" value={card.series} onChange={(e) => setCard((p) => ({ ...p, series: e.target.value }))} />
              </Field>
              <Field label="Repetições" htmlFor="crep">
                <Input id="crep" inputMode="numeric" value={card.reps} onChange={(e) => setCard((p) => ({ ...p, reps: e.target.value }))} />
              </Field>
            </div>
            <Field label="Observação (opcional)" htmlFor="cobs">
              <Input id="cobs" value={card.obs} onChange={(e) => setCard((p) => ({ ...p, obs: e.target.value }))} />
            </Field>
            <Button onClick={saveCard} disabled={pending}>
              Adicionar ao treino
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
