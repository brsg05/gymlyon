"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validation";
import { calcMetrics, goalSeeds } from "@/lib/domain/calc";
import { ageFromBirth } from "@/lib/domain/time";

export type OnboardingState = { error?: string };

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const raw = {
    sexo: formData.get("sexo"),
    data_nascimento: formData.get("data_nascimento"),
    altura_cm: formData.get("altura_cm"),
    peso_inicial_kg: formData.get("peso_inicial_kg"),
    percentual_gordura: formData.get("percentual_gordura") || null,
    objetivo: formData.get("objetivo"),
    nivel_atividade: formData.get("nivel_atividade"),
  };

  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const p = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const idade = ageFromBirth(p.data_nascimento);
  const { tmb, tdee } = calcMetrics({
    sexo: p.sexo,
    idade,
    altura_cm: p.altura_cm,
    peso_kg: p.peso_inicial_kg,
    percentual_gordura: p.percentual_gordura ?? null,
    nivel_atividade: p.nivel_atividade,
  });

  const { error: profileError } = await supabase.from("profile").insert({
    user_id: user.id,
    sexo: p.sexo,
    data_nascimento: p.data_nascimento,
    altura_cm: p.altura_cm,
    peso_inicial_kg: p.peso_inicial_kg,
    percentual_gordura: p.percentual_gordura ?? null,
    objetivo: p.objetivo,
    nivel_atividade: p.nivel_atividade,
    tmb,
    tdee,
  });
  if (profileError) return { error: profileError.message };

  // Registro de peso inicial.
  await supabase.from("registro_peso").insert({
    peso_kg: p.peso_inicial_kg,
    medido_em: new Date().toISOString(),
  });

  // Seed de metas editáveis (§8).
  const seeds = goalSeeds(tdee, p.peso_inicial_kg, p.objetivo);
  const metas = [
    { tipo: "agua", valor_alvo: seeds.agua_ml, periodo: "diario", ativa: true },
    { tipo: "proteina", valor_alvo: seeds.proteina_g, periodo: "diario", ativa: true },
  ];
  if (seeds.deficit_kcal > 0) {
    metas.push({ tipo: "deficit_calorico", valor_alvo: seeds.deficit_kcal, periodo: "diario", ativa: true });
  }
  await supabase.from("meta").insert(metas);

  redirect("/dashboard");
}
