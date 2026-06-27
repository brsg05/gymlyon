import type { NivelAtividade, Objetivo, Sexo, MetaTipo } from "@/lib/types";

export const ACTIVITY_FACTOR: Record<NivelAtividade, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  muito: 1.725,
  extremo: 1.9,
};

export const NIVEL_LABEL: Record<NivelAtividade, string> = {
  sedentario: "Sedentário",
  leve: "Levemente ativo",
  moderado: "Moderadamente ativo",
  muito: "Muito ativo",
  extremo: "Extremamente ativo",
};

export const OBJETIVO_LABEL: Record<Objetivo, string> = {
  emagrecer: "Emagrecer",
  ganhar_massa: "Ganhar massa",
  manter: "Manter peso",
};

export const SEXO_LABEL: Record<Sexo, string> = {
  m: "Masculino",
  f: "Feminino",
};

export const QUALIDADE_LABEL: Record<number, string> = {
  1: "Muito ruim",
  2: "Ruim",
  3: "Regular",
  4: "Boa",
  5: "Excelente",
};

export const META_LABEL: Record<MetaTipo, string> = {
  peso: "Peso",
  agua: "Água",
  proteina: "Proteína",
  deficit_calorico: "Déficit calórico",
  sono: "Sono",
};

export const META_UNIT: Record<MetaTipo, string> = {
  peso: "kg",
  agua: "ml",
  proteina: "g",
  deficit_calorico: "kcal",
  sono: "h",
};

export const WATER_PRESETS = [200, 300, 500, 1000];

export const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const WEEKDAYS_FULL = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
