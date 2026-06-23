"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createTraining } from "@/lib/actions/training";
import { formatClock } from "@/lib/domain/time";
import { toast } from "@/lib/toast";

type Status = "parado" | "rodando" | "pausado";

interface Persisted {
  status: Status;
  inicioEm: string | null; // ISO of first start (treino.inicio_em)
  accumulatedMs: number; // completed running time before current segment
  segmentStart: number | null; // epoch ms of current running segment
}

const KEY = "gymlyon.stopwatch";
const INITIAL: Persisted = { status: "parado", inicioEm: null, accumulatedMs: 0, segmentStart: null };

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Persisted) : INITIAL;
  } catch {
    return INITIAL;
  }
}

// External store backed by localStorage so state survives reloads/background (A3).
let current: Persisted | null = null;
const subs = new Set<() => void>();

function readState(): Persisted {
  if (current == null) current = load();
  return current;
}
function writeState(next: Persisted) {
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  subs.forEach((f) => f());
}
function subscribeState(cb: () => void) {
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
}

/** Elapsed ms derived purely from timestamps — correct after background (A3). */
function elapsedOf(s: Persisted, nowMs: number): number {
  return s.accumulatedMs + (s.status === "rodando" && s.segmentStart ? nowMs - s.segmentStart : 0);
}

export function Stopwatch() {
  const router = useRouter();
  const state = useSyncExternalStore(subscribeState, readState, () => INITIAL);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [pending, start] = useTransition();

  // Re-derive elapsed on tick and when returning from background.
  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    const id = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, []);

  function update(next: Persisted) {
    writeState(next);
    setNowMs(Date.now());
  }

  function iniciar() {
    const t = Date.now();
    update({ status: "rodando", inicioEm: new Date(t).toISOString(), accumulatedMs: 0, segmentStart: t });
  }

  function pausar() {
    const t = Date.now();
    update({ ...state, status: "pausado", accumulatedMs: elapsedOf(state, t), segmentStart: null });
  }

  function continuar() {
    update({ ...state, status: "rodando", segmentStart: Date.now() });
  }

  function resetar() {
    update(INITIAL);
  }

  function encerrar() {
    const elapsed = elapsedOf(state, Date.now());
    const duracao = Math.round(elapsed / 1000);
    const inicio = state.inicioEm ?? new Date().toISOString();
    start(async () => {
      const r = await createTraining({ inicio_em: inicio, duracao_segundos: duracao });
      if (r.error || !r.data) {
        toast(r.error ?? "Erro ao salvar treino.", "error");
        return;
      }
      update(INITIAL);
      toast("Treino salvo.", "success");
      router.push(`/treinos/${r.data.id}`);
      router.refresh();
    });
  }

  const elapsed = elapsedOf(state, nowMs);
  const running = state.status === "rodando";
  const idle = state.status === "parado";

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-6">
        <p className="font-mono text-5xl font-bold tabular-nums tracking-tight">
          {formatClock(elapsed / 1000)}
        </p>
        <p className="-mt-2 text-sm text-muted-foreground">
          {idle ? "Pronto para começar" : running ? "Em andamento" : "Pausado"}
        </p>
        <div className="flex w-full gap-3">
          {idle ? (
            <Button size="lg" className="flex-1" onClick={iniciar}>
              <Play /> Iniciar treino
            </Button>
          ) : (
            <>
              {running ? (
                <Button size="lg" variant="secondary" className="flex-1" onClick={pausar}>
                  <Pause /> Pausar
                </Button>
              ) : (
                <Button size="lg" variant="secondary" className="flex-1" onClick={continuar}>
                  <Play /> Continuar
                </Button>
              )}
              <Button size="lg" className="flex-1" onClick={encerrar} disabled={pending}>
                <Square /> Encerrar
              </Button>
            </>
          )}
        </div>
        {!idle ? (
          <button
            type="button"
            onClick={resetar}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive"
          >
            <RotateCcw className="size-4" /> Descartar
          </button>
        ) : null}
      </CardContent>
    </Card>
  );
}
