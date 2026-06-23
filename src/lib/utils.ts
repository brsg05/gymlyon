import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** pt-BR number with comma decimal separator. */
export function nf(value: number, digits = 1) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

export function intf(value: number) {
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}
