import Link from "next/link";
import { Dumbbell, ChevronRight, LineChart, Clock } from "lucide-react";
import { TZDate } from "@date-fns/tz";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Stopwatch } from "@/components/stopwatch";
import { TrainingCalendar } from "@/components/training-calendar";
import { createClient } from "@/lib/supabase/server";
import { TZ, now, monthRangeUtc, formatDuration, formatDateBR, formatTimeBR } from "@/lib/domain/time";
import type { Treino } from "@/lib/types";

export default async function TreinosPage() {
  const supabase = await createClient();
  const nowTz = now();
  const year = nowTz.getFullYear();
  const month = nowTz.getMonth() + 1;
  const todayDay = nowTz.getDate();
  const { start, end } = monthRangeUtc(year, month);

  const [{ data: monthRows }, { data: recentRows }] = await Promise.all([
    supabase.from("treino").select("inicio_em").gte("inicio_em", start).lt("inicio_em", end),
    supabase
      .from("treino")
      .select("*, treino_exercicio(count)")
      .order("inicio_em", { ascending: false })
      .limit(15),
  ]);

  const trainedDays = new Set<number>(
    (monthRows ?? []).map((r) => new TZDate(new Date(r.inicio_em).getTime(), TZ).getDate()),
  );
  const recent = (recentRows ?? []) as unknown as (Treino & { treino_exercicio: { count: number }[] })[];

  return (
    <>
      <PageHeader title="Treinos" subtitle="Cronômetro e histórico" back="/dashboard" />
      <div className="flex flex-col gap-5 px-4 pt-4">
        <Stopwatch />

        <Card>
          <CardContent className="py-4">
            <TrainingCalendar year={year} month1to12={month} trainedDays={trainedDays} todayDay={todayDay} />
          </CardContent>
        </Card>

        <Link
          href="/treinos/exercicios"
          className="flex items-center justify-between rounded-xl border bg-card px-4 py-3.5 font-medium transition-colors hover:bg-muted"
        >
          <span className="flex items-center gap-3">
            <LineChart className="size-5 text-primary" /> Evolução por exercício
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>

        <section>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Últimos treinos</p>
          <div className="flex flex-col gap-2">
            {recent.length === 0 ? (
              <Card>
                <CardContent className="p-2">
                  <EmptyState icon={Dumbbell} title="Nenhum treino ainda" description="Inicie o cronômetro para registrar." />
                </CardContent>
              </Card>
            ) : (
              recent.map((t) => (
                <Link key={t.id} href={`/treinos/${t.id}`}>
                  <Card className="transition-colors hover:bg-muted/40">
                    <CardContent className="flex items-center justify-between gap-2 py-3">
                      <div>
                        <p className="font-medium">{formatDateBR(t.inicio_em)}</p>
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="size-3.5" /> {formatTimeBR(t.inicio_em)} · {formatDuration(t.duracao_segundos)}
                          {" · "}
                          {t.treino_exercicio?.[0]?.count ?? 0} exercícios
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
