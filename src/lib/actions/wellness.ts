"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { aguaSchema, pesoSchema, refeicaoSchema, sonoSchema } from "@/lib/validation";

type Result = { error?: string };

const PATHS = ["/dashboard", "/agua", "/peso", "/alimentacao", "/sono", "/metas"];
function revalidate() {
  for (const p of PATHS) revalidatePath(p);
}

export async function addWater(quantidade_ml: number): Promise<Result> {
  const parsed = aguaSchema.safeParse({ quantidade_ml });
  if (!parsed.success) return { error: "Quantidade inválida." };
  const supabase = await createClient();
  const { error } = await supabase.from("registro_agua").insert({
    quantidade_ml: parsed.data.quantidade_ml,
    registrado_em: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function deleteWater(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("registro_agua").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function addWeight(input: { peso_kg: string; medido_em: string }): Promise<Result> {
  const parsed = pesoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const supabase = await createClient();
  const { error } = await supabase.from("registro_peso").insert({
    peso_kg: parsed.data.peso_kg,
    medido_em: parsed.data.medido_em,
  });
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function deleteWeight(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("registro_peso").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function addMeal(input: {
  nome: string;
  calorias: number | null;
  peso_g: number | null;
  proteina_g: number | null;
  carboidrato_g: number | null;
  gordura_g: number | null;
}): Promise<Result> {
  const parsed = refeicaoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const supabase = await createClient();
  const { error } = await supabase.from("refeicao").insert({
    nome: parsed.data.nome,
    calorias: parsed.data.calorias ?? null,
    peso_g: parsed.data.peso_g ?? null,
    proteina_g: parsed.data.proteina_g ?? null,
    carboidrato_g: parsed.data.carboidrato_g ?? null,
    gordura_g: parsed.data.gordura_g ?? null,
    consumido_em: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function deleteMeal(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("refeicao").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function addSleep(input: {
  deitar_em: string;
  acordar_em: string;
  qualidade: number;
}): Promise<Result> {
  const parsed = sonoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const supabase = await createClient();
  const { error } = await supabase.from("registro_sono").insert({
    deitar_em: parsed.data.deitar_em,
    acordar_em: parsed.data.acordar_em,
    qualidade: parsed.data.qualidade,
    data_referencia: parsed.data.acordar_em.slice(0, 10), // overwritten by trigger
  });
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function deleteSleep(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("registro_sono").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}
