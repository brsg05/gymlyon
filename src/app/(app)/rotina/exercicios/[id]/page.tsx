import { notFound } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LineAreaChart } from "@/components/charts/line-area-chart";
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

  // Uma sessão por data: carga representativa = peso máximo do dia.
  const byDate = new Map<string, SerieRegistro[]>();
  for (const s of sets) {
    const arr = byDate.get(s.data_referencia) ?? [];
    arr.push(s);
    byDate.set(s.data_referencia, arr);
  }
  const sessions = [...byDate.entries()]
    .map(([date, items]) => ({
      date,
      items,
      maxPeso: Math.max(...items.map((i) => Number(i.peso_kg))),
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const chart = [...sessions]
    .reverse()
    .map((s) => ({ label: formatDateRef(s.date).slice(0, 5), value: Math.round(s.maxPeso * 10) / 10 }));
  const recorde = sessions.reduce((m, s) => Math.max(m, s.maxPeso), 0);

  return (
    <>
      <PageHeader title={ex.nome} subtitle={ex.grupo_muscular ?? "Evolução de carga"} back="/rotina/exercicios" />
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
          <>
            <Card>
              <CardContent className="flex items-end justify-between py-4">
                <div>
                  <p className="text-sm text-muted-foreground">Recorde de carga</p>
                  <p className="text-3xl font-bold">
                    {nf(recorde, 1)} <span className="text-base font-medium text-muted-foreground">kg</span>
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{sessions.length} sessões</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="mb-2 text-sm font-medium text-muted-foreground">Carga máxima por sessão</p>
                <LineAreaChart data={chart} unit=" kg" />
              </CardContent>
            </Card>
          </>
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
