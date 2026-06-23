import { z } from "zod";

export const onboardingSchema = z.object({
  sexo: z.enum(["m", "f"]),
  data_nascimento: z.string().min(1, "Informe a data de nascimento"),
  altura_cm: z.coerce.number().int().min(100).max(250),
  peso_inicial_kg: z.coerce.number().min(20).max(400),
  percentual_gordura: z.coerce.number().min(3).max(70).optional().nullable(),
  objetivo: z.enum(["emagrecer", "ganhar_massa", "manter"]),
  nivel_atividade: z.enum(["sedentario", "leve", "moderado", "muito", "extremo"]),
});

export const pesoSchema = z.object({
  peso_kg: z.coerce.number().min(20).max(400),
  medido_em: z.string().min(1),
});

export const aguaSchema = z.object({
  quantidade_ml: z.coerce.number().int().min(1).max(5000),
});

export const refeicaoSchema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  calorias: z.coerce.number().min(0).optional().nullable(),
  peso_g: z.coerce.number().min(0).optional().nullable(),
  proteina_g: z.coerce.number().min(0).optional().nullable(),
  carboidrato_g: z.coerce.number().min(0).optional().nullable(),
  gordura_g: z.coerce.number().min(0).optional().nullable(),
  consumido_em: z.string().optional(),
});

export const sonoSchema = z
  .object({
    deitar_em: z.string().min(1),
    acordar_em: z.string().min(1),
    qualidade: z.coerce.number().int().min(1).max(5),
  })
  .refine((v) => new Date(v.acordar_em) > new Date(v.deitar_em), {
    message: "Acordar deve ser depois de deitar",
    path: ["acordar_em"],
  });

export const metaSchema = z.object({
  tipo: z.enum(["peso", "agua", "proteina", "deficit_calorico", "sono"]),
  valor_alvo: z.coerce.number().positive(),
  periodo: z.enum(["diario", "mensal"]),
});

export const treinoSchema = z.object({
  inicio_em: z.string().min(1),
  duracao_segundos: z.coerce.number().int().min(0),
  observacao: z.string().optional().nullable(),
});

export const treinoExercicioSchema = z.object({
  treino_id: z.string().uuid(),
  exercicio_id: z.string().uuid(),
  peso_kg: z.coerce.number().min(0),
  series: z.coerce.number().int().min(1),
  repeticoes: z.coerce.number().int().min(1),
  descanso_segundos: z.coerce.number().int().min(0).optional().nullable(),
  observacao: z.string().optional().nullable(),
  ordem: z.coerce.number().int().min(0).default(0),
});

export const exercicioSchema = z.object({
  nome: z.string().min(1),
  grupo_muscular: z.string().optional().nullable(),
});

/** Parse a possibly-empty form value into number | null. */
export function optNum(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const s = String(v).trim().replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function reqStr(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}
