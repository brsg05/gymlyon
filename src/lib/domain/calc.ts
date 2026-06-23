import type { NivelAtividade, Objetivo, Sexo } from "@/lib/types";
import { ACTIVITY_FACTOR } from "./constants";

export interface MetricsInput {
  sexo: Sexo;
  idade: number;
  altura_cm: number;
  peso_kg: number;
  percentual_gordura: number | null;
  nivel_atividade: NivelAtividade;
}

/** BMR via Katch-McArdle when body fat is known, else Mifflin-St Jeor. */
export function calcTMB(i: MetricsInput): number {
  if (i.percentual_gordura != null) {
    const massaMagra = i.peso_kg * (1 - i.percentual_gordura / 100);
    return 370 + 21.6 * massaMagra;
  }
  const s = i.sexo === "m" ? 5 : -161;
  return 10 * i.peso_kg + 6.25 * i.altura_cm - 5 * i.idade + s;
}

export function calcTDEE(tmb: number, nivel: NivelAtividade): number {
  return tmb * ACTIVITY_FACTOR[nivel];
}

export function calcMetrics(i: MetricsInput): { tmb: number; tdee: number } {
  const tmb = calcTMB(i);
  return { tmb: round1(tmb), tdee: round1(calcTDEE(tmb, i.nivel_atividade)) };
}

export interface GoalSeeds {
  calorias: number;
  proteina_g: number;
  agua_ml: number;
  deficit_kcal: number;
}

/** Editable seed suggestions for goals derived from onboarding (D4/D5/§8). */
export function goalSeeds(tdee: number, peso_kg: number, objetivo: Objetivo): GoalSeeds {
  const proteinFactor = objetivo === "ganhar_massa" ? 2.0 : objetivo === "emagrecer" ? 1.8 : 1.6;
  const deficit = objetivo === "emagrecer" ? 500 : objetivo === "ganhar_massa" ? -300 : 0;
  return {
    calorias: Math.round(tdee - deficit),
    proteina_g: Math.round(peso_kg * proteinFactor),
    agua_ml: Math.round(peso_kg * 35),
    deficit_kcal: deficit,
  };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/** Daily caloric deficit. null = unavailable (some meal missing calories, D6). */
export function dailyDeficit(
  tdee: number | null,
  meals: { calorias: number | null }[],
): { value: number | null; available: boolean; hasMeals: boolean } {
  if (tdee == null) return { value: null, available: false, hasMeals: meals.length > 0 };
  if (meals.length === 0) return { value: null, available: false, hasMeals: false };
  const anyMissing = meals.some((m) => m.calorias == null);
  if (anyMissing) return { value: null, available: false, hasMeals: true };
  const total = meals.reduce((acc, m) => acc + (m.calorias ?? 0), 0);
  return { value: Math.round(tdee - total), available: true, hasMeals: true };
}

export function sum(values: (number | null | undefined)[]): number {
  return values.reduce<number>((acc, v) => acc + (v ?? 0), 0);
}
