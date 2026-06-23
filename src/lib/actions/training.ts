"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exercicioSchema, treinoExercicioSchema, treinoSchema } from "@/lib/validation";

type Result<T = unknown> = { error?: string; data?: T };

function revalidate(id?: string) {
  revalidatePath("/treinos");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/treinos/${id}`);
}

export async function createTraining(input: {
  inicio_em: string;
  duracao_segundos: number;
  observacao?: string | null;
}): Promise<Result<{ id: string }>> {
  const parsed = treinoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("treino")
    .insert({
      inicio_em: parsed.data.inicio_em,
      duracao_segundos: parsed.data.duracao_segundos,
      observacao: parsed.data.observacao ?? null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidate(data.id);
  return { data: { id: data.id } };
}

export async function updateTraining(
  id: string,
  input: { inicio_em: string; duracao_segundos: number; observacao?: string | null },
): Promise<Result> {
  const parsed = treinoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("treino")
    .update({
      inicio_em: parsed.data.inicio_em,
      duracao_segundos: parsed.data.duracao_segundos,
      observacao: parsed.data.observacao ?? null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidate(id);
  return {};
}

export async function deleteTraining(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("treino").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function addCard(input: {
  treino_id: string;
  exercicio_id: string;
  peso_kg: number;
  series: number;
  repeticoes: number;
  descanso_segundos: number | null;
  observacao: string | null;
  ordem: number;
}): Promise<Result> {
  const parsed = treinoExercicioSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const supabase = await createClient();
  const { error } = await supabase.from("treino_exercicio").insert(parsed.data);
  if (error) return { error: error.message };
  revalidate(input.treino_id);
  return {};
}

export async function deleteCard(id: string, treino_id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("treino_exercicio").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate(treino_id);
  return {};
}

export async function createExercise(input: {
  nome: string;
  grupo_muscular?: string | null;
}): Promise<Result<{ id: string }>> {
  const parsed = exercicioSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };
  const { data, error } = await supabase
    .from("exercicio")
    .insert({ nome: parsed.data.nome, grupo_muscular: parsed.data.grupo_muscular ?? null, user_id: user.id })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidate();
  return { data: { id: data.id } };
}
