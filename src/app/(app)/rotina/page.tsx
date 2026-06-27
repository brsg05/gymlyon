import Link from "next/link";
import { Dumbbell, History } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { TreinosTabs } from "@/components/treinos-tabs";
import { AddRoutineExercise } from "@/components/rotina/add-routine-exercise";
import { LogSetForm } from "@/components/rotina/log-set-form";
import { DeleteButton } from "@/components/delete-button";
import { createClient } from "@/lib/supabase/server";
import { removeRoutineExercise, deleteSet } from "@/lib/actions/rotina";
import { dayRef, todayWeekday, formatDateRef } from "@/lib/domain/time";
import { WEEKDAYS_SHORT, WEEKDAYS_FULL } from "@/lib/domain/constants";
import { cn, nf } from "@/lib/utils";
import type { Exercicio, RotinaExercicio, SerieRegistro } from "@/lib/types";

type RoutineRow = RotinaExercicio & { exercicio: Pick<Exercicio, "nome" | "grupo_muscular"> | null };

export default async function RotinaPage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string }>;
}) {
  const sp = await searchParams;
  const today = todayWeekday();
  const parsed = sp.dia != null ? Number(sp.dia) : today;
  const dia = Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? parsed : today;
  const todayRef = dayRef();

  const supabase = await createClient();
  const [{ data: routineRows }, { data: setRows }, { data: catalog }] = await Promise.all([
    supabase
      .from("rotina_exercicio")
      .select("*, exercicio(nome, grupo_muscular)")
      .eq("dia_semana", dia)
      .order("ordem", { ascending: true }),
    supabase
      .from("serie_registro")
      .select("*")
      .eq("dia_semana", dia)
      .order("registrado_em", { ascending: false })
      .limit(400),
    supabase.from("exercicio").select("id, nome, grupo_muscular").order("nome"),
  ]);

  const routine = (routineRows ?? []) as unknown as RoutineRow[];
  const sets = (setRows ?? []) as SerieRegistro[];
  const exercicios = (catalog ?? []) as Pick<Exercicio, "id" | "nome" | "grupo_muscular">[];

  const setsByExercise = new Map<string, SerieRegistro[]>();
  for (const s of sets) {
    const arr = setsByExercise.get(s.exercicio_id) ?? [];
    arr.push(s);
    setsByExercise.set(s.exercicio_id, arr);
  }

  return (
    <>
      <PageHeader title="Rotina" subtitle="Exercícios fixos por dia" back="/dashboard" />
      <div className="flex flex-col gap-4 px-4 pt-4">
        <TreinosTabs />

        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS_SHORT.map((label, i) => {
            const active = i === dia;
            return (
              <Link
                key={i}
                href={`/rotina?dia=${i}`}
                className={cn(
                  "flex flex-col items-center rounded-xl border py-2 text-xs font-medium transition-colors",
                  active ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-muted",
                )}
              >
                {label}
                {i === today ? (
                  <span className={cn("mt-0.5 size-1.5 rounded-full", active ? "bg-primary" : "bg-muted-foreground/50")} />
                ) : (
                  <span className="mt-0.5 size-1.5" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{WEEKDAYS_FULL[dia]}</h2>
          {dia === today ? <Badge>Hoje</Badge> : null}
        </div>

        <AddRoutineExercise dia={dia} exercicios={exercicios} existingIds={routine.map((r) => r.exercicio_id)} />

        {routine.length === 0 ? (
          <Card>
            <CardContent className="p-2">
              <EmptyState
                icon={Dumbbell}
                title="Nenhum exercício neste dia"
                description="Adicione os exercícios fixos deste dia da semana."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {routine.map((r) => {
              const all = setsByExercise.get(r.exercicio_id) ?? [];
              const todaySets = all.filter((s) => s.data_referencia === todayRef);
              const history = groupByDate(all.filter((s) => s.data_referencia !== todayRef));
              return (
                <Card key={r.id}>
                  <CardContent className="flex flex-col gap-3 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{r.exercicio?.nome ?? "Exercício"}</p>
                        {r.exercicio?.grupo_muscular ? (
                          <p className="text-xs text-muted-foreground">{r.exercicio.grupo_muscular}</p>
                        ) : null}
                      </div>
                      <DeleteButton action={removeRoutineExercise.bind(null, r.id)} label="Remover do dia" />
                    </div>

                    {todaySets.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {todaySets.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-muted py-1 pl-2.5 pr-1 text-sm"
                          >
                            <span className="font-medium">{setLabel(s)}</span>
                            <DeleteButton action={deleteSet.bind(null, s.id)} className="size-6" />
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sem séries registradas hoje.</p>
                    )}

                    <LogSetForm exercicioId={r.exercicio_id} dia={dia} />

                    {history.length > 0 ? (
                      <details className="group">
                        <summary className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
                          <History className="size-4" /> Histórico ({history.length})
                        </summary>
                        <div className="mt-2 flex flex-col gap-2 border-l-2 pl-3">
                          {history.map(([date, items]) => (
                            <div key={date}>
                              <p className="text-xs font-medium text-muted-foreground">{formatDateRef(date)}</p>
                              <p className="text-sm">{items.map(setLabel).join(" · ")}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function setLabel(s: SerieRegistro): string {
  return `${s.series}×${s.repeticoes} · ${nf(s.peso_kg, 1)} kg`;
}

function groupByDate(items: SerieRegistro[]): [string, SerieRegistro[]][] {
  const map = new Map<string, SerieRegistro[]>();
  for (const s of items) {
    const arr = map.get(s.data_referencia) ?? [];
    arr.push(s);
    map.set(s.data_referencia, arr);
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
}
