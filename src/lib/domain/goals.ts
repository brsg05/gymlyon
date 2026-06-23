import type { Meta, Objetivo } from "@/lib/types";

export interface GoalProgress {
  ratio: number; // 0..1 clamped
  current: number | null;
  target: number;
  available: boolean;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

/** Progress for a daily goal where current accumulates toward target. */
export function dailyRatioProgress(current: number | null, target: number): GoalProgress {
  if (current == null) return { ratio: 0, current: null, target, available: false };
  return { ratio: clamp01(target > 0 ? current / target : 0), current, target, available: true };
}

/**
 * Weight goal progress (§7): (peso_inicial - peso_atual) / (peso_inicial - alvo),
 * sign per objetivo, clamped 0..1.
 */
export function weightProgress(
  pesoInicial: number,
  pesoAtual: number | null,
  alvo: number,
  objetivo: Objetivo,
): GoalProgress {
  if (pesoAtual == null) return { ratio: 0, current: null, target: alvo, available: false };
  const denom = pesoInicial - alvo;
  let ratio = denom === 0 ? 1 : (pesoInicial - pesoAtual) / denom;
  if (objetivo === "ganhar_massa") ratio = denom === 0 ? 1 : (pesoAtual - pesoInicial) / (alvo - pesoInicial);
  return { ratio: clamp01(ratio), current: pesoAtual, target: alvo, available: true };
}

export function metaProgress(
  meta: Meta,
  ctx: {
    aguaHoje: number | null;
    proteinaHoje: number | null;
    deficitHoje: number | null;
    deficitDisponivel: boolean;
    sonoHoje: number | null;
    pesoInicial: number;
    pesoAtual: number | null;
    objetivo: Objetivo;
  },
): GoalProgress {
  switch (meta.tipo) {
    case "agua":
      return dailyRatioProgress(ctx.aguaHoje, meta.valor_alvo);
    case "proteina":
      return dailyRatioProgress(ctx.proteinaHoje, meta.valor_alvo);
    case "sono":
      return dailyRatioProgress(ctx.sonoHoje, meta.valor_alvo);
    case "deficit_calorico":
      return ctx.deficitDisponivel
        ? dailyRatioProgress(ctx.deficitHoje, meta.valor_alvo)
        : { ratio: 0, current: null, target: meta.valor_alvo, available: false };
    case "peso":
      return weightProgress(ctx.pesoInicial, ctx.pesoAtual, meta.valor_alvo, ctx.objetivo);
  }
}
