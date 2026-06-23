import { createClient } from "@/lib/supabase/server";
import { dayRangeUtc } from "@/lib/domain/time";
import type {
  Meta,
  Profile,
  Refeicao,
  RegistroAgua,
  RegistroPeso,
  RegistroSono,
} from "@/lib/types";

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profile").select("*").maybeSingle();
  return data as Profile | null;
}

export async function getWaterEntries(date: string): Promise<RegistroAgua[]> {
  const supabase = await createClient();
  const { start, end } = dayRangeUtc(date);
  const { data } = await supabase
    .from("registro_agua")
    .select("*")
    .gte("registrado_em", start)
    .lt("registrado_em", end)
    .order("registrado_em", { ascending: false });
  return (data ?? []) as RegistroAgua[];
}

export async function getMeals(date: string): Promise<Refeicao[]> {
  const supabase = await createClient();
  const { start, end } = dayRangeUtc(date);
  const { data } = await supabase
    .from("refeicao")
    .select("*")
    .gte("consumido_em", start)
    .lt("consumido_em", end)
    .order("consumido_em", { ascending: false });
  return (data ?? []) as Refeicao[];
}

export async function getSleepForDay(date: string): Promise<RegistroSono | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("registro_sono")
    .select("*")
    .eq("data_referencia", date)
    .order("acordar_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as RegistroSono | null;
}

export async function getLatestWeight(): Promise<RegistroPeso | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("registro_peso")
    .select("*")
    .order("medido_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as RegistroPeso | null;
}

export async function getTrainingSeconds(date: string): Promise<number> {
  const supabase = await createClient();
  const { start, end } = dayRangeUtc(date);
  const { data } = await supabase
    .from("treino")
    .select("duracao_segundos")
    .gte("inicio_em", start)
    .lt("inicio_em", end);
  return (data ?? []).reduce((acc: number, r) => acc + (r.duracao_segundos ?? 0), 0);
}

export async function getActiveGoals(): Promise<Meta[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meta")
    .select("*")
    .eq("ativa", true)
    .order("created_at", { ascending: true });
  return (data ?? []) as Meta[];
}
