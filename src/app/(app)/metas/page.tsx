import { Target } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { GoalAdd } from "@/components/goal-add";
import { GoalRow } from "@/components/goal-row";
import {
  getProfile,
  getWaterEntries,
  getMeals,
  getSleepForDay,
  getLatestWeight,
} from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { dayRef } from "@/lib/domain/time";
import { dailyDeficit, sum } from "@/lib/domain/calc";
import { metaProgress } from "@/lib/domain/goals";
import type { Meta } from "@/lib/types";

export default async function MetasPage() {
  const today = dayRef();
  const supabase = await createClient();
  const [profile, water, meals, sleep, weight, allRes] = await Promise.all([
    getProfile(),
    getWaterEntries(today),
    getMeals(today),
    getSleepForDay(today),
    getLatestWeight(),
    supabase.from("meta").select("*").order("ativa", { ascending: false }).order("created_at"),
  ]);
  const metas = (allRes.data ?? []) as Meta[];

  const waterTotal = sum(water.map((w) => w.quantidade_ml));
  const proteina = meals.some((m) => m.proteina_g != null) ? sum(meals.map((m) => m.proteina_g)) : null;
  const deficit = dailyDeficit(profile?.tdee ?? null, meals);

  const ctx = {
    aguaHoje: waterTotal,
    proteinaHoje: proteina,
    deficitHoje: deficit.value,
    deficitDisponivel: deficit.available,
    sonoHoje: sleep?.horas_dormidas ?? null,
    pesoInicial: profile?.peso_inicial_kg ?? 0,
    pesoAtual: weight?.peso_kg ?? null,
    objetivo: profile?.objetivo ?? ("manter" as const),
  };

  return (
    <>
      <PageHeader title="Metas" subtitle="Acompanhe seu progresso" back="/dashboard" />
      <div className="flex flex-col gap-4 px-4 pt-4">
        <GoalAdd />
        {metas.length === 0 ? (
          <Card>
            <CardContent className="p-2">
              <EmptyState icon={Target} title="Sem metas" description="Crie metas diárias ou mensais para acompanhar." />
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {metas.map((m) => {
              const p = metaProgress(m, ctx);
              return (
                <GoalRow key={m.id} meta={m} ratio={p.ratio} current={p.current} available={p.available} />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
