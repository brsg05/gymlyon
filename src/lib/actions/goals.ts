"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { metaSchema } from "@/lib/validation";
import type { MetaTipo, Periodo } from "@/lib/types";

type Result = { error?: string };

function revalidate() {
  revalidatePath("/metas");
  revalidatePath("/dashboard");
}

export async function createGoal(input: {
  tipo: MetaTipo;
  valor_alvo: number;
  periodo: Periodo;
}): Promise<Result> {
  const parsed = metaSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const supabase = await createClient();
  const { error } = await supabase.from("meta").insert({
    tipo: parsed.data.tipo,
    valor_alvo: parsed.data.valor_alvo,
    periodo: parsed.data.periodo,
    ativa: true,
  });
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function updateGoal(id: string, valor_alvo: number): Promise<Result> {
  if (!(valor_alvo > 0)) return { error: "Valor inválido." };
  const supabase = await createClient();
  const { error } = await supabase.from("meta").update({ valor_alvo }).eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function toggleGoal(id: string, ativa: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("meta").update({ ativa }).eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function deleteGoal(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("meta").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}
