"use client";

import { useActionState, useMemo, useState } from "react";
import { Dumbbell } from "lucide-react";
import { completeOnboarding, type OnboardingState } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn, intf } from "@/lib/utils";
import { calcMetrics, goalSeeds } from "@/lib/domain/calc";
import { ageFromBirth } from "@/lib/domain/time";
import { NIVEL_LABEL, OBJETIVO_LABEL, SEXO_LABEL } from "@/lib/domain/constants";
import type { NivelAtividade, Objetivo, Sexo } from "@/lib/types";

type Form = {
  sexo: Sexo | "";
  data_nascimento: string;
  altura_cm: string;
  peso_inicial_kg: string;
  percentual_gordura: string;
  objetivo: Objetivo | "";
  nivel_atividade: NivelAtividade | "";
};

const EMPTY: Form = {
  sexo: "",
  data_nascimento: "",
  altura_cm: "",
  peso_inicial_kg: "",
  percentual_gordura: "",
  objetivo: "",
  nivel_atividade: "",
};

const STEPS = ["Dados", "Objetivo", "Atividade", "Resultado"];

export function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [state, action] = useActionState<OnboardingState, FormData>(completeOnboarding, {});

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const metrics = useMemo(() => {
    const peso = Number(form.peso_inicial_kg.replace(",", "."));
    const altura = Number(form.altura_cm.replace(",", "."));
    if (!form.sexo || !form.data_nascimento || !peso || !altura || !form.nivel_atividade) return null;
    const gordura = form.percentual_gordura ? Number(form.percentual_gordura.replace(",", ".")) : null;
    const m = calcMetrics({
      sexo: form.sexo,
      idade: ageFromBirth(form.data_nascimento),
      altura_cm: altura,
      peso_kg: peso,
      percentual_gordura: gordura,
      nivel_atividade: form.nivel_atividade,
    });
    const seeds = form.objetivo ? goalSeeds(m.tdee, peso, form.objetivo) : null;
    return { ...m, seeds };
  }, [form]);

  const canNext =
    (step === 0 && form.sexo && form.data_nascimento && form.altura_cm && form.peso_inicial_kg) ||
    (step === 1 && form.objetivo) ||
    (step === 2 && form.nivel_atividade) ||
    step === 3;

  return (
    <form action={action} className="flex flex-1 flex-col">
      {/* hidden inputs carry all values regardless of visible step */}
      <input type="hidden" name="sexo" value={form.sexo} />
      <input type="hidden" name="data_nascimento" value={form.data_nascimento} />
      <input type="hidden" name="altura_cm" value={form.altura_cm} />
      <input type="hidden" name="peso_inicial_kg" value={form.peso_inicial_kg} />
      <input type="hidden" name="percentual_gordura" value={form.percentual_gordura} />
      <input type="hidden" name="objetivo" value={form.objetivo} />
      <input type="hidden" name="nivel_atividade" value={form.nivel_atividade} />

      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Dumbbell className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vamos te conhecer</h1>
          <p className="text-sm text-muted-foreground">{STEPS[step]} · passo {step + 1} de 4</p>
        </div>
        <div className="flex w-full max-w-xs gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")}
            />
          ))}
        </div>
      </div>

      <div className="flex-1">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <Field label="Sexo">
              <OptionRow
                value={form.sexo}
                options={(["m", "f"] as Sexo[]).map((v) => ({ value: v, label: SEXO_LABEL[v] }))}
                onChange={(v) => set("sexo", v)}
              />
            </Field>
            <Field label="Data de nascimento" htmlFor="dn">
              <Input
                id="dn"
                type="date"
                value={form.data_nascimento}
                onChange={(e) => set("data_nascimento", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Altura (cm)" htmlFor="alt">
                <Input
                  id="alt"
                  inputMode="numeric"
                  value={form.altura_cm}
                  onChange={(e) => set("altura_cm", e.target.value)}
                  placeholder="175"
                />
              </Field>
              <Field label="Peso (kg)" htmlFor="peso">
                <Input
                  id="peso"
                  inputMode="decimal"
                  value={form.peso_inicial_kg}
                  onChange={(e) => set("peso_inicial_kg", e.target.value)}
                  placeholder="72,5"
                />
              </Field>
            </div>
            <Field label="% de gordura (opcional)" htmlFor="bf" hint="Se informado, usamos Katch-McArdle no cálculo.">
              <Input
                id="bf"
                inputMode="decimal"
                value={form.percentual_gordura}
                onChange={(e) => set("percentual_gordura", e.target.value)}
                placeholder="18"
              />
            </Field>
          </div>
        )}

        {step === 1 && (
          <Field label="Qual seu objetivo?">
            <OptionColumn
              value={form.objetivo}
              options={(["emagrecer", "ganhar_massa", "manter"] as Objetivo[]).map((v) => ({
                value: v,
                label: OBJETIVO_LABEL[v],
              }))}
              onChange={(v) => set("objetivo", v)}
            />
          </Field>
        )}

        {step === 2 && (
          <Field label="Nível de atividade">
            <OptionColumn
              value={form.nivel_atividade}
              options={(
                ["sedentario", "leve", "moderado", "muito", "extremo"] as NivelAtividade[]
              ).map((v) => ({ value: v, label: NIVEL_LABEL[v] }))}
              onChange={(v) => set("nivel_atividade", v)}
            />
          </Field>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <Card>
              <CardContent className="grid grid-cols-2 gap-4 py-5">
                <Metric label="TMB" value={metrics ? `${intf(metrics.tmb)} kcal` : "—"} />
                <Metric label="TDEE" value={metrics ? `${intf(metrics.tdee)} kcal` : "—"} />
              </CardContent>
            </Card>
            {metrics?.seeds ? (
              <Card>
                <CardContent className="py-4">
                  <p className="mb-3 text-sm font-medium">Metas sugeridas (editáveis depois)</p>
                  <ul className="space-y-2 text-sm">
                    <SeedRow label="Calorias" value={`${intf(metrics.seeds.calorias)} kcal/dia`} />
                    <SeedRow label="Proteína" value={`${intf(metrics.seeds.proteina_g)} g/dia`} />
                    <SeedRow label="Água" value={`${intf(metrics.seeds.agua_ml)} ml/dia`} />
                    {metrics.seeds.deficit_kcal > 0 ? (
                      <SeedRow label="Déficit" value={`${intf(metrics.seeds.deficit_kcal)} kcal/dia`} />
                    ) : null}
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground">Preencha os passos anteriores para ver o cálculo.</p>
            )}
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        {step > 0 ? (
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep((s) => s - 1)}>
            Voltar
          </Button>
        ) : null}
        {step < 3 ? (
          <Button
            type="button"
            size="lg"
            className="flex-1"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
          >
            Continuar
          </Button>
        ) : (
          <FinishButton disabled={!metrics} />
        )}
      </div>
    </form>
  );
}

function FinishButton({ disabled }: { disabled: boolean }) {
  return (
    <Button type="submit" size="lg" className="flex-1" disabled={disabled}>
      Concluir
    </Button>
  );
}

function OptionRow<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | "";
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "tap rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
            value === o.value ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function OptionColumn<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | "";
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "tap rounded-xl border px-4 py-3.5 text-left text-base font-medium transition-colors",
            value === o.value ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function SeedRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </li>
  );
}
