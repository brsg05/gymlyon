import { notFound } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LineAreaChart } from "@/components/charts/line-area-chart";
import { createClient } from "@/lib/supabase/server";
import { formatDateBR } from "@/lib/domain/time";
import { nf } from "@/lib/utils";

export default async function ExercicioProgressoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: ex }, { data: rows }] = await Promise.all([
    supabase.from("exercicio").select("nome, grupo_muscular").eq("id", id).maybeSingle(),
    supabase
      .from("treino_exercicio")
      .select("peso_kg, series, repeticoes, treino(inicio_em)")
      .eq("exercicio_id", id)
      .limit(500),
  ]);

  if (!ex) notFound();

  const logs = ((rows ?? []) as unknown as {
    peso_kg: number;
    series: number;
    repeticoes: number;
    treino: { inicio_em: string } | null;
  }[])
    .filter((r) => r.treino)
    .sort((a, b) => new Date(a.treino!.inicio_em).getTime() - new Date(b.treino!.inicio_em).getTime());

  const chart = logs.map((r) => ({ label: formatDateBR(r.treino!.inicio_em).slice(0, 5), value: Number(r.peso_kg) }));
  const maxPeso = logs.reduce((m, r) => Math.max(m, Number(r.peso_kg)), 0);

  return (
    <>
      <PageHeader title={ex.nome} subtitle={ex.grupo_muscular ?? "Evolução de carga"} back="/treinos/exercicios" />
      <div className="flex flex-col gap-5 px-4 pt-4">
        {logs.length < 2 ? (
          <Card>
            <CardContent className="p-2">
              <EmptyState
                icon={TrendingUp}
                title="Dados insuficientes"
                description="Registre este exercício em pelo menos dois treinos para ver a evolução."
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="flex items-end justify-between py-4">
                <div>
                  <p className="text-sm text-muted-foreground">Carga máxima</p>
                  <p className="text-3xl font-bold">
                    {nf(maxPeso, 1)} <span className="text-base font-medium text-muted-foreground">kg</span>
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{logs.length} registros</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="mb-2 text-sm font-medium text-muted-foreground">Carga por treino</p>
                <LineAreaChart data={chart} unit=" kg" />
              </CardContent>
            </Card>
          </>
        )}

        <section>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Registros</p>
          <div className="flex flex-col gap-2">
            {logs.length === 0 ? null : (
              [...logs].reverse().map((r, i) => (
                <Card key={i}>
                  <CardContent className="flex items-center justify-between py-3 text-sm">
                    <span className="font-medium">{nf(r.peso_kg, 1)} kg</span>
                    <span className="text-muted-foreground">
                      {r.series}×{r.repeticoes} · {formatDateBR(r.treino!.inicio_em)}
                    </span>
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
