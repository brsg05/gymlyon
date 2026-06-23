import { notFound } from "next/navigation";
import { Clock, Dumbbell, StickyNote } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { ExerciseCardForm } from "@/components/exercise-card-form";
import { DeleteButton } from "@/components/delete-button";
import { DeleteTraining } from "@/components/delete-training";
import { createClient } from "@/lib/supabase/server";
import { deleteCard } from "@/lib/actions/training";
import { formatDateBR, formatTimeBR, formatDuration } from "@/lib/domain/time";
import { nf } from "@/lib/utils";
import type { Exercicio, Treino, TreinoExercicio } from "@/lib/types";

export default async function TreinoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: treino }, { data: cardRows }, { data: exRows }] = await Promise.all([
    supabase.from("treino").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("treino_exercicio")
      .select("*, exercicio(nome, grupo_muscular)")
      .eq("treino_id", id)
      .order("ordem", { ascending: true }),
    supabase.from("exercicio").select("id, nome, grupo_muscular").order("nome"),
  ]);

  if (!treino) notFound();
  const t = treino as Treino;
  const cards = (cardRows ?? []) as unknown as (TreinoExercicio & {
    exercicio: Pick<Exercicio, "nome" | "grupo_muscular"> | null;
  })[];
  const exercicios = (exRows ?? []) as Pick<Exercicio, "id" | "nome" | "grupo_muscular">[];
  const nextOrdem = cards.length;

  return (
    <>
      <PageHeader title={formatDateBR(t.inicio_em)} subtitle="Detalhes do treino" back="/treinos" action={<DeleteTraining id={t.id} />} />
      <div className="flex flex-col gap-5 px-4 pt-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <Badge variant="default" className="gap-1 px-3 py-1 text-sm">
              <Clock className="size-4" /> {formatDuration(t.duracao_segundos)}
            </Badge>
            <span className="text-sm text-muted-foreground">Início {formatTimeBR(t.inicio_em)}</span>
          </CardContent>
        </Card>

        {t.observacao ? (
          <Card>
            <CardContent className="flex gap-2 py-3 text-sm">
              <StickyNote className="size-4 shrink-0 text-muted-foreground" />
              {t.observacao}
            </CardContent>
          </Card>
        ) : null}

        <ExerciseCardForm treinoId={t.id} exercicios={exercicios} nextOrdem={nextOrdem} />

        <section>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Exercícios</p>
          <div className="flex flex-col gap-2">
            {cards.length === 0 ? (
              <Card>
                <CardContent className="p-2">
                  <EmptyState icon={Dumbbell} title="Nenhum exercício" description="Adicione os exercícios deste treino." />
                </CardContent>
              </Card>
            ) : (
              cards.map((c) => (
                <Card key={c.id}>
                  <CardContent className="flex items-center justify-between gap-2 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.exercicio?.nome ?? "Exercício"}</p>
                      <p className="text-xs text-muted-foreground">
                        {nf(c.peso_kg, 1)} kg · {c.series}×{c.repeticoes}
                        {c.descanso_segundos ? ` · ${c.descanso_segundos}s descanso` : ""}
                        {c.observacao ? ` · ${c.observacao}` : ""}
                      </p>
                    </div>
                    <DeleteButton action={deleteCard.bind(null, c.id, t.id)} />
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
