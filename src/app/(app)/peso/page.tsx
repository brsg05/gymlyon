import { Scale } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { WeightForm } from "@/components/weight-form";
import { DeleteButton } from "@/components/delete-button";
import { LineAreaChart } from "@/components/charts/line-area-chart";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries";
import { deleteWeight } from "@/lib/actions/wellness";
import { dayRef, formatDateRef, formatTimeBR } from "@/lib/domain/time";
import { nf } from "@/lib/utils";
import type { RegistroPeso } from "@/lib/types";

interface DaySession {
  date: string;
  measurements: RegistroPeso[];
  avg: number;
  min: number;
  max: number;
}

export default async function PesoPage() {
  const supabase = await createClient();
  const [{ data: rows }, profile] = await Promise.all([
    supabase.from("registro_peso").select("*").order("medido_em", { ascending: false }).limit(120),
    getProfile(),
  ]);
  const weights = (rows ?? []) as RegistroPeso[];
  const latest = weights[0] ?? null;
  const inicial = profile?.peso_inicial_kg ?? null;
  const delta = latest && inicial != null ? latest.peso_kg - inicial : null;

  // Agrupa por dia: cada dia é uma "sessão". A tendência usa a média diária,
  // separando flutuação dentro do dia de mudança real de peso.
  const byDay = new Map<string, RegistroPeso[]>();
  for (const w of weights) {
    const d = dayRef(w.medido_em);
    const arr = byDay.get(d) ?? [];
    arr.push(w);
    byDay.set(d, arr);
  }
  const sessions: DaySession[] = [...byDay.entries()]
    .map(([date, ms]) => {
      const vals = ms.map((m) => Number(m.peso_kg));
      return {
        date,
        measurements: ms,
        avg: vals.reduce((a, b) => a + b, 0) / vals.length,
        min: Math.min(...vals),
        max: Math.max(...vals),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const chart = [...sessions]
    .reverse()
    .map((s) => ({ label: formatDateRef(s.date).slice(0, 5), value: Math.round(s.avg * 10) / 10 }));

  return (
    <>
      <PageHeader title="Peso" subtitle="Evolução corporal" back="/dashboard" />
      <div className="flex flex-col gap-5 px-4 pt-4">
        <Card>
          <CardContent className="flex items-end justify-between py-5">
            <div>
              <p className="text-sm text-muted-foreground">Peso atual</p>
              <p className="text-4xl font-bold">
                {latest ? nf(latest.peso_kg, 1) : "—"}
                <span className="ml-1 text-lg font-medium text-muted-foreground">kg</span>
              </p>
            </div>
            {delta != null ? (
              <Badge variant={delta <= 0 ? "default" : "muted"}>
                {delta > 0 ? "+" : ""}
                {nf(delta, 1)} kg desde o início
              </Badge>
            ) : null}
          </CardContent>
        </Card>

        {chart.length >= 2 ? (
          <Card>
            <CardContent className="py-4">
              <p className="mb-1 text-sm font-medium text-muted-foreground">Evolução (média diária)</p>
              <LineAreaChart data={chart} unit=" kg" />
            </CardContent>
          </Card>
        ) : null}

        <WeightForm />

        <section>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Histórico por dia</p>
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="p-2">
                <EmptyState icon={Scale} title="Sem registros" description="Registre seu peso para ver a evolução." />
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2.5">
              {sessions.map((s) => (
                <Card key={s.date}>
                  <CardContent className="flex flex-col gap-1.5 py-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{formatDateRef(s.date)}</p>
                      <p className="text-lg font-bold">
                        {nf(s.avg, 1)} <span className="text-xs font-medium text-muted-foreground">kg{s.measurements.length > 1 ? " méd." : ""}</span>
                      </p>
                    </div>
                    {s.measurements.length > 1 ? (
                      <p className="text-xs text-muted-foreground">
                        Flutuação no dia: {nf(s.min, 1)}–{nf(s.max, 1)} kg · {s.measurements.length} medições
                      </p>
                    ) : null}
                    <ul className="divide-y">
                      {s.measurements.map((m) => (
                        <li key={m.id} className="flex items-center justify-between py-1.5 text-sm">
                          <span className="font-medium">{nf(m.peso_kg, 1)} kg</span>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">{formatTimeBR(m.medido_em)}</span>
                            <DeleteButton action={deleteWeight.bind(null, m.id)} className="size-7" />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
