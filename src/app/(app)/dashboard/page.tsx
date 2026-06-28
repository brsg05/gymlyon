import Link from "next/link";
import { Droplets, Flame, Beef, Scale, Moon, Dumbbell, Target } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QuickWater } from "@/components/quick-water";
import { StatCard } from "@/components/stat-card";
import {
  getProfile,
  getWaterEntries,
  getMeals,
  getSleepForDay,
  getLatestWeight,
  getTrainedToday,
  getActiveGoals,
} from "@/lib/queries";
import { dayRef, now } from "@/lib/domain/time";
import { dailyDeficit, sum } from "@/lib/domain/calc";
import { metaProgress } from "@/lib/domain/goals";
import { META_LABEL, META_UNIT } from "@/lib/domain/constants";
import { intf, nf } from "@/lib/utils";

export default async function DashboardPage() {
  const today = dayRef();
  const [profile, water, meals, sleep, weight, treino, goals] = await Promise.all([
    getProfile(),
    getWaterEntries(today),
    getMeals(today),
    getSleepForDay(today),
    getLatestWeight(),
    getTrainedToday(today),
    getActiveGoals(),
  ]);

  const waterTotal = sum(water.map((w) => w.quantidade_ml));
  const calorias = meals.some((m) => m.calorias != null) ? sum(meals.map((m) => m.calorias)) : null;
  const proteina = meals.some((m) => m.proteina_g != null) ? sum(meals.map((m) => m.proteina_g)) : null;
  const deficit = dailyDeficit(profile?.tdee ?? null, meals);

  const goalByType = Object.fromEntries(goals.filter((g) => g.periodo === "diario").map((g) => [g.tipo, g]));
  const aguaGoal = goalByType["agua"];
  const proteinaGoal = goalByType["proteina"];

  const niceDate = format(now(), "EEEE, d 'de' MMMM", { locale: ptBR });

  const goalCtx = {
    aguaHoje: waterTotal,
    proteinaHoje: proteina,
    deficitHoje: deficit.value,
    deficitDisponivel: deficit.available,
    sonoHoje: sleep?.horas_dormidas ?? null,
    pesoInicial: profile?.peso_inicial_kg ?? 0,
    pesoAtual: weight?.peso_kg ?? null,
    objetivo: profile?.objetivo ?? "manter",
  };

  return (
    <div className="flex flex-col gap-5 px-4 pt-6">
      <header>
        <p className="text-sm capitalize text-muted-foreground">{niceDate}</p>
        <h1 className="text-2xl font-bold tracking-tight">Hoje</h1>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="size-5 text-[var(--water)]" />
              <span className="font-semibold">Água rápida</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {waterTotal > 0 ? `${intf(waterTotal)} ml hoje` : "comece agora"}
            </span>
          </div>
          <QuickWater />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Droplets}
          label="Água"
          accent="water"
          href="/agua"
          empty={waterTotal === 0}
          value={intf(waterTotal)}
          unit="ml"
          progress={aguaGoal ? Math.min(1, waterTotal / aguaGoal.valor_alvo) : undefined}
          footer={aguaGoal ? `Meta ${intf(aguaGoal.valor_alvo)} ml` : undefined}
        />
        <StatCard
          icon={Flame}
          label="Calorias"
          accent="calorie"
          href="/alimentacao"
          empty={calorias == null}
          value={calorias != null ? intf(calorias) : undefined}
          unit="kcal"
          footer={
            deficit.available
              ? `Déficit ${intf(deficit.value!)} kcal`
              : deficit.hasMeals
                ? "Déficit indisponível"
                : undefined
          }
        />
        <StatCard
          icon={Beef}
          label="Proteína"
          accent="protein"
          href="/alimentacao"
          empty={proteina == null}
          value={proteina != null ? intf(proteina) : undefined}
          unit="g"
          progress={proteinaGoal && proteina != null ? Math.min(1, proteina / proteinaGoal.valor_alvo) : undefined}
          footer={proteinaGoal ? `Meta ${intf(proteinaGoal.valor_alvo)} g` : undefined}
        />
        <StatCard
          icon={Scale}
          label="Peso"
          accent="primary"
          href="/peso"
          empty={!weight}
          value={weight ? nf(weight.peso_kg, 1) : undefined}
          unit="kg"
          footer={weight ? "Último registro" : undefined}
        />
        <StatCard
          icon={Moon}
          label="Sono"
          accent="sleep"
          href="/sono"
          empty={!sleep}
          value={sleep ? nf(sleep.horas_dormidas, 1) : undefined}
          unit="h"
          footer={sleep ? "Última noite" : undefined}
        />
        <StatCard
          icon={Dumbbell}
          label="Treino"
          accent="primary"
          href="/rotina"
          empty={treino.series === 0}
          value={treino.series > 0 ? treino.series : undefined}
          unit={treino.series > 0 ? (treino.series === 1 ? "série" : "séries") : undefined}
          footer={treino.series > 0 ? `${treino.exercicios} exerc.` : undefined}
        />
      </div>

      {goals.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Target className="size-5 text-primary" /> Metas
            </h2>
            <Link href="/metas" className="text-sm font-medium text-primary">
              Ver todas
            </Link>
          </div>
          <Card>
            <CardContent className="flex flex-col gap-4 py-4">
              {goals.map((g) => {
                const p = metaProgress(g, goalCtx);
                return (
                  <div key={g.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{META_LABEL[g.tipo]}</span>
                      <span className="text-muted-foreground">
                        {p.available
                          ? `${Math.round(p.ratio * 100)}% · ${intf(p.current ?? 0)}/${intf(g.valor_alvo)} ${META_UNIT[g.tipo]}`
                          : "indisponível"}
                      </span>
                    </div>
                    <Progress value={p.ratio * 100} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
