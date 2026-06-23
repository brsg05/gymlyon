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
import { formatDateBR } from "@/lib/domain/time";
import { nf } from "@/lib/utils";
import type { RegistroPeso } from "@/lib/types";

export default async function PesoPage() {
  const supabase = await createClient();
  const [{ data: rows }, profile] = await Promise.all([
    supabase.from("registro_peso").select("*").order("medido_em", { ascending: false }).limit(60),
    getProfile(),
  ]);
  const weights = (rows ?? []) as RegistroPeso[];
  const latest = weights[0] ?? null;
  const inicial = profile?.peso_inicial_kg ?? null;
  const delta = latest && inicial != null ? latest.peso_kg - inicial : null;

  const chart = [...weights]
    .reverse()
    .map((w) => ({ label: formatDateBR(w.medido_em).slice(0, 5), value: Number(w.peso_kg) }));

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
              <p className="mb-2 text-sm font-medium text-muted-foreground">Evolução</p>
              <LineAreaChart data={chart} unit=" kg" />
            </CardContent>
          </Card>
        ) : null}

        <WeightForm />

        <section>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Histórico</p>
          <Card>
            <CardContent className="p-2">
              {weights.length === 0 ? (
                <EmptyState icon={Scale} title="Sem registros" description="Registre seu peso para ver a evolução." />
              ) : (
                <ul className="divide-y">
                  {weights.map((w) => (
                    <li key={w.id} className="flex items-center justify-between px-2 py-2.5">
                      <span className="font-medium">{nf(w.peso_kg, 1)} kg</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{formatDateBR(w.medido_em)}</span>
                        <DeleteButton action={deleteWeight.bind(null, w.id)} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
