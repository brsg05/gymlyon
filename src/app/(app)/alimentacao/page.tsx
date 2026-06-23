import { UtensilsCrossed, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MealForm } from "@/components/meal-form";
import { DeleteButton } from "@/components/delete-button";
import { getMeals, getProfile } from "@/lib/queries";
import { deleteMeal } from "@/lib/actions/wellness";
import { dayRef, formatTimeBR } from "@/lib/domain/time";
import { dailyDeficit, sum } from "@/lib/domain/calc";
import { intf, nf } from "@/lib/utils";

export default async function AlimentacaoPage() {
  const today = dayRef();
  const [meals, profile] = await Promise.all([getMeals(today), getProfile()]);

  const calorias = meals.some((m) => m.calorias != null) ? sum(meals.map((m) => m.calorias)) : null;
  const proteina = sum(meals.map((m) => m.proteina_g));
  const carbo = sum(meals.map((m) => m.carboidrato_g));
  const gordura = sum(meals.map((m) => m.gordura_g));
  const deficit = dailyDeficit(profile?.tdee ?? null, meals);

  return (
    <>
      <PageHeader title="Refeições" subtitle="Alimentação de hoje" back="/dashboard" />
      <div className="flex flex-col gap-5 px-4 pt-4">
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <Totals label="Calorias" value={calorias != null ? intf(calorias) : "—"} unit="kcal" />
              <Totals label="Proteína" value={nf(proteina, 0)} unit="g" />
              <Totals label="Carbo" value={nf(carbo, 0)} unit="g" />
              <Totals label="Gordura" value={nf(gordura, 0)} unit="g" />
            </div>
            <div className="mt-4 border-t pt-3 text-sm">
              {deficit.available ? (
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">Déficit calórico</span>
                  <span className="font-semibold">{intf(deficit.value!)} kcal</span>
                </p>
              ) : deficit.hasMeals ? (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <TriangleAlert className="size-4 text-[var(--calorie)]" />
                  Déficit indisponível: alguma refeição sem calorias.
                </p>
              ) : (
                <p className="text-muted-foreground">Registre refeições para calcular o déficit.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <MealForm />

        <section>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Refeições de hoje</p>
          <div className="flex flex-col gap-2">
            {meals.length === 0 ? (
              <Card>
                <CardContent className="p-2">
                  <EmptyState icon={UtensilsCrossed} title="Sem registros hoje" description="Adicione sua primeira refeição." />
                </CardContent>
              </Card>
            ) : (
              meals.map((m) => (
                <Card key={m.id}>
                  <CardContent className="flex items-center justify-between gap-2 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{m.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          m.calorias != null ? `${intf(m.calorias)} kcal` : null,
                          m.proteina_g != null ? `P ${nf(m.proteina_g, 0)}g` : null,
                          m.carboidrato_g != null ? `C ${nf(m.carboidrato_g, 0)}g` : null,
                          m.gordura_g != null ? `G ${nf(m.gordura_g, 0)}g` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "sem macros"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{formatTimeBR(m.consumido_em)}</span>
                      <DeleteButton action={deleteMeal.bind(null, m.id)} />
                    </div>
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

function Totals({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <p className="text-lg font-bold leading-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground">
        {label} · {unit}
      </p>
    </div>
  );
}
