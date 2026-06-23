import { Droplets } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { QuickWater } from "@/components/quick-water";
import { DeleteButton } from "@/components/delete-button";
import { getWaterEntries, getActiveGoals } from "@/lib/queries";
import { deleteWater } from "@/lib/actions/wellness";
import { dayRef, formatTimeBR } from "@/lib/domain/time";
import { sum } from "@/lib/domain/calc";
import { intf } from "@/lib/utils";

export default async function AguaPage() {
  const today = dayRef();
  const [entries, goals] = await Promise.all([getWaterEntries(today), getActiveGoals()]);
  const total = sum(entries.map((e) => e.quantidade_ml));
  const goal = goals.find((g) => g.tipo === "agua" && g.periodo === "diario");
  const ratio = goal ? Math.min(1, total / goal.valor_alvo) : null;

  return (
    <>
      <PageHeader title="Água" subtitle="Hidratação de hoje" back="/dashboard" />
      <div className="flex flex-col gap-5 px-4 pt-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-6">
            <Droplets className="size-7 text-[var(--water)]" />
            <p className="text-4xl font-bold">
              {intf(total)} <span className="text-lg font-medium text-muted-foreground">ml</span>
            </p>
            {goal ? (
              <>
                <Progress value={(ratio ?? 0) * 100} color="var(--water)" className="mt-2 max-w-xs" />
                <p className="text-sm text-muted-foreground">
                  {Math.round((ratio ?? 0) * 100)}% da meta de {intf(goal.valor_alvo)} ml
                </p>
              </>
            ) : null}
          </CardContent>
        </Card>

        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Adicionar</p>
          <QuickWater />
        </div>

        <section>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Registros de hoje</p>
          <Card>
            <CardContent className="p-2">
              {entries.length === 0 ? (
                <EmptyState icon={Droplets} title="Sem registros hoje" description="Use os botões acima para registrar." />
              ) : (
                <ul className="divide-y">
                  {entries.map((e) => (
                    <li key={e.id} className="flex items-center justify-between px-2 py-2.5">
                      <span className="font-medium">{intf(e.quantidade_ml)} ml</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">{formatTimeBR(e.registrado_em)}</span>
                        <DeleteButton action={deleteWater.bind(null, e.id)} />
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
