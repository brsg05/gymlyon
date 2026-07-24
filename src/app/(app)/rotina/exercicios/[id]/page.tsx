import { notFound } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ExerciseEvolution, type EvolutionPoint } from "@/components/rotina/exercise-evolution";
import { createClient } from "@/lib/supabase/server";
import { formatDateRef } from "@/lib/domain/time";
import { nf } from "@/lib/utils";
import type { SerieRegistro } from "@/lib/types";

export default async function EvolucaoExercicioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: ex }, { data: rows }] = await Promise.all([
    supabase.from("exercicio").select("nome, grupo_muscular").eq("id", id).maybeSingle(),
    supabase
      .from("serie_registro")
      .select("*")
      .eq("exercicio_id", id)
      .order("registrado_em", { ascending: false })
      .limit(500),
  ]);

  if (!ex) notFound();
  const sets = (rows ?? []) as SerieRegistro[];

  // Uma sessão por data, com três métricas: carga (peso máx.), 1RM estimado (Epley) e volume total.
  const byDate = new Map<string, SerieRegistro[]>();
  for (const s of sets) {
    const arr = byDate.get(s.data_referencia) ?? [];
    arr.push(s);
    byDate.set(s.data_referencia, arr);
  }
  const sessions = [...byDate.entries()]
    .map(([date, items]) => {
      const nums = items.map((i) => ({
        series: Number(i.series),
        reps: Number(i.repeticoes),
        peso: Number(i.peso_kg),
      }));
      return {
        date,
        items,
        carga: Math.max(...nums.map((n) => n.peso)),
        e1rm: Math.max(...nums.map((n) => n.peso * (1 + n.reps / 30))),
        volume: nums.reduce((sum, n) => sum + n.series * n.reps * n.peso, 0),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  // Pontos do gráfico em ordem cronológica (antigo → recente).
  const points: EvolutionPoint[] = [...sessions].reverse().map((s) => ({
    label: formatDateRef(s.date).slice(0, 5),
    carga: Math.round(s.carga * 10) / 10,
    e1rm: Math.round(s.e1rm * 10) / 10,
    volume: Math.round(s.volume),
  }));

  return (
    <>
      <PageHeader title={ex.nome} subtitle={ex.grupo_muscular ?? "Evolução"} back="/rotina/exercicios" />
      <div className="flex flex-col gap-5 px-4 pt-4">
        {sessions.length < 2 ? (
          <Card>
            <CardContent className="p-2">
              <EmptyState
                icon={TrendingUp}
                title="Dados insuficientes"
                description="Registre este exercício em pelo menos duas datas para ver a evolução."
              />
            </CardContent>
          </Card>
        ) : (
          <ExerciseEvolution points={points} sessionCount={sessions.length} />
        )}

        <section>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Sessões</p>
          <div className="flex flex-col gap-2">
            {sessions.map((s) => (
              <Card key={s.date}>
                <CardContent className="flex items-center justify-between gap-2 py-3 text-sm">
                  <span className="text-muted-foreground">{formatDateRef(s.date)}</span>
                  <span className="font-medium">
                    {s.items
                      .map((i) => `${i.series}×${i.repeticoes} ${nf(i.peso_kg, 1)}kg`)
                      .join(" · ")}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
