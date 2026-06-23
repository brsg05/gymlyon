export type Sexo = "m" | "f";
export type Objetivo = "emagrecer" | "ganhar_massa" | "manter";
export type NivelAtividade = "sedentario" | "leve" | "moderado" | "muito" | "extremo";
export type MetaTipo = "peso" | "agua" | "proteina" | "deficit_calorico" | "sono";
export type Periodo = "diario" | "mensal";

export interface Profile {
  user_id: string;
  sexo: Sexo;
  data_nascimento: string;
  altura_cm: number;
  peso_inicial_kg: number;
  percentual_gordura: number | null;
  objetivo: Objetivo;
  nivel_atividade: NivelAtividade;
  tmb: number | null;
  tdee: number | null;
  created_at: string;
}

export interface RegistroPeso {
  id: string;
  user_id: string;
  peso_kg: number;
  medido_em: string;
  created_at: string;
}

export interface RegistroAgua {
  id: string;
  user_id: string;
  quantidade_ml: number;
  registrado_em: string;
  created_at: string;
}

export interface Refeicao {
  id: string;
  user_id: string;
  nome: string;
  calorias: number | null;
  peso_g: number | null;
  proteina_g: number | null;
  carboidrato_g: number | null;
  gordura_g: number | null;
  consumido_em: string;
  created_at: string;
}

export interface RegistroSono {
  id: string;
  user_id: string;
  deitar_em: string;
  acordar_em: string;
  horas_dormidas: number;
  qualidade: number;
  data_referencia: string;
  created_at: string;
}

export interface Treino {
  id: string;
  user_id: string;
  inicio_em: string;
  duracao_segundos: number;
  observacao: string | null;
  created_at: string;
}

export interface Exercicio {
  id: string;
  user_id: string | null;
  nome: string;
  grupo_muscular: string | null;
  created_at: string;
}

export interface TreinoExercicio {
  id: string;
  user_id: string;
  treino_id: string;
  exercicio_id: string;
  peso_kg: number;
  series: number;
  repeticoes: number;
  descanso_segundos: number | null;
  observacao: string | null;
  ordem: number;
  created_at: string;
}

export interface Meta {
  id: string;
  user_id: string;
  tipo: MetaTipo;
  valor_alvo: number;
  periodo: Periodo;
  ativa: boolean;
  created_at: string;
}
