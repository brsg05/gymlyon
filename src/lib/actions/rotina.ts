"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dayRef } from "@/lib/domain/time";

type Result = { error?: string };

function revalidate() {
  revalidatePath("/rotina");
}

export async function addRoutineExercise(dia_semana: number, exercicio_id: string): Promise<Result> {
  if (dia_semana < 0 || dia_semana > 6) return { error: "Dia inválido." };
  const supabase = await createClient();
  const { count } = await supabase
    .from("rotina_exercicio")
    .select("id", { count: "exact", head: true })
    .eq("dia_semana", dia_semana);
  const { error } = await supabase
    .from("rotina_exercicio")
    .insert({ dia_semana, exercicio_id, ordem: count ?? 0 });
  if (error) {
    if (error.code === "23505") return { error: "Exercício já está nesse dia." };
    return { error: error.message };
  }
  revalidate();
  return {};
}

export async function createExerciseForRoutine(
  dia_semana: number,
  exercicio: { nome: string; grupo_muscular?: string | null },
): Promise<Result> {
  const nome = exercicio.nome.trim();
  if (!nome) return { error: "Informe o nome." };
  if (dia_semana < 0 || dia_semana > 6) return { error: "Dia inválido." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { data: created, error: exError } = await supabase
    .from("exercicio")
    .insert({ nome, grupo_muscular: exercicio.grupo_muscular ?? null, user_id: user.id })
    .select("id")
    .single();
  if (exError || !created) return { error: exError?.message ?? "Erro ao criar exercício." };

  return addRoutineExercise(dia_semana, created.id);
}

export async function removeRoutineExercise(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("rotina_exercicio").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function logSet(input: {
  exercicio_id: string;
  dia_semana: number;
  series: number;
  repeticoes: number;
  peso_kg: number;
}): Promise<Result> {
  if (!(input.series >= 1) || !(input.repeticoes >= 1)) return { error: "Séries e repetições inválidas." };
  if (!(input.peso_kg >= 0)) return { error: "Peso inválido." };
  const supabase = await createClient();
  const { error } = await supabase.from("serie_registro").insert({
    exercicio_id: input.exercicio_id,
    dia_semana: input.dia_semana,
    series: input.series,
    repeticoes: input.repeticoes,
    peso_kg: input.peso_kg,
    registrado_em: new Date().toISOString(),
    data_referencia: dayRef(),
  });
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function deleteSet(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("serie_registro").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}
