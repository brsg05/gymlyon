import Link from "next/link";
import { Dumbbell, History, LineChart, ChevronRight, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { TrainingCalendar } from "@/components/training-calendar";
import { AddRoutineExercise } from "@/components/rotina/add-routine-exercise";
import { LogSetForm } from "@/components/rotina/log-set-form";
import { DeleteButton } from "@/components/delete-button";
import { createClient } from "@/lib/supabase/server";
import { removeRoutineExercise, deleteSet } from "@/lib/actions/rotina";
import { now, dayRef, todayWeekday, formatDateRef } from "@/lib/domain/time";
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

  const nowTz = now();
  const year = nowTz.getFullYear();
  const month = nowTz.getMonth() + 1;
  const todayDay = nowTz.getDate();
  const mm = String(month).padStart(2, "0");
  const monthStart = `${year}-${mm}-01`;
  const monthEnd = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const supabase = await createClient();
  const [
    { data: routineRows },
    { data: setRows },
    { data: catalog },
    { data: monthSets },
    { data: recentSets },
  ] = await Promise.all([
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
    supabase
      .from("serie_registro")
      .select("data_referencia")
      .gte("data_referencia", monthStart)
      .lt("data_referencia", monthEnd),
    supabase
      .from("serie_registro")
      .select("data_referencia, exercicio_id")
      .order("data_referencia", { ascending: false })
      .limit(500),
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

  // Dia treinado = existe ao menos uma série registrada na data.
  const trainedDays = new Set<number>(
    ((monthSets ?? []) as { data_referencia: string }[]).map((r) => Number(r.data_referencia.slice(8, 10))),
  );

  const dayExercises = new Map<string, Set<string>>();
  const daySets = new Map<string, number>();
  for (const r of (recentSets ?? []) as { data_referencia: string; exercicio_id: string }[]) {
    if (!dayExercises.has(r.data_referencia)) dayExercises.set(r.data_referencia, new Set());
    dayExercises.get(r.data_referencia)!.add(r.exercicio_id);
    daySets.set(r.data_referencia, (daySets.get(r.data_referencia) ?? 0) + 1);
  }
  const recentDays = [...dayExercises.entries()]
    .map(([date, exs]) => ({ date, exercicios: exs.size, series: daySets.get(date) ?? 0 }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 8);

  return (
    <>
      <PageHeader title="Rotina" subtitle="Exercícios fixos por dia" back="/dashboard" />
      <div className="flex flex-col gap-4 px-4 pt-4">
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
              const sessions = groupByDate(setsByExercise.get(r.exercicio_id) ?? []);
              const recent = sessions.slice(0, 4);
              const older = sessions.slice(4);
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

                    <LogSetForm exercicioId={r.exercicio_id} dia={dia} />

                    {sessions.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sem séries registradas. Registre a primeira acima.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {recent.map(([date, items]) => (
                          <SessionBlock key={date} date={date} items={items} isToday={date === todayRef} />
                        ))}
                        {older.length > 0 ? (
                          <details className="group">
                            <summary className="flex cursor-pointer items-center gap-1.5 py-1 text-sm text-muted-foreground">
                              <History className="size-4" /> Sessões anteriores ({older.length})
                            </summary>
                            <div className="mt-2 flex flex-col gap-2">
                              {older.map(([date, items]) => (
                                <SessionBlock key={date} date={date} items={items} isToday={false} />
                              ))}
                            </div>
                          </details>
                        ) : null}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-2 flex flex-col gap-4 border-t pt-5">
          <Link
            href="/rotina/exercicios"
            className="flex items-center justify-between rounded-xl border bg-card px-4 py-3.5 font-medium transition-colors hover:bg-muted"
          >
            <span className="flex items-center gap-3">
              <LineChart className="size-5 text-primary" /> Evolução por exercício
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>

          <Card>
            <CardContent className="py-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarDays className="size-4" /> Dias treinados
              </p>
              <TrainingCalendar year={year} month1to12={month} trainedDays={trainedDays} todayDay={todayDay} />
            </CardContent>
          </Card>

          <section>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Últimos treinos</p>
            {recentDays.length === 0 ? (
              <Card>
                <CardContent className="p-2">
                  <EmptyState icon={Dumbbell} title="Nenhum treino ainda" description="Registre séries para marcar um dia treinado." />
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-2">
                {recentDays.map((d) => (
                  <Card key={d.date}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{formatDateRef(d.date)}</p>
                        {d.date === todayRef ? <Badge>Hoje</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {d.exercicios} {d.exercicios === 1 ? "exercício" : "exercícios"} · {d.series}{" "}
                        {d.series === 1 ? "série" : "séries"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function setLabel(s: SerieRegistro): string {
  return `${s.series}×${s.repeticoes} · ${nf(s.peso_kg, 1)} kg`;
}

function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function SessionBlock({
  date,
  items,
  isToday,
}: {
  date: string;
  items: SerieRegistro[];
  isToday: boolean;
}) {
  return (
    <div className={cn("rounded-xl border p-2.5", isToday ? "border-primary/40 bg-primary/5" : "bg-muted/30")}>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-semibold">
          {isToday ? "Hoje" : WEEKDAYS_SHORT[weekdayOf(date)]} · {formatDateRef(date).slice(0, 5)}
        </p>
        <span className="text-[11px] text-muted-foreground">
          {items.length} {items.length === 1 ? "série" : "séries"}
        </span>
      </div>
      {isToday ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1 rounded-lg bg-card py-1 pl-2.5 pr-1 text-sm shadow-sm">
              <span className="font-medium">{setLabel(s)}</span>
              <DeleteButton action={deleteSet.bind(null, s.id)} className="size-6" />
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm">{items.map(setLabel).join(" · ")}</p>
      )}
    </div>
  );
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
