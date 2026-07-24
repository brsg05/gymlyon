"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTrainedDays } from "@/lib/actions/rotina";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function TrainingCalendar({
  initialYear,
  initialMonth1to12,
  initialTrainedDays,
  todayYear,
  todayMonth1to12,
  todayDay,
}: {
  initialYear: number;
  initialMonth1to12: number;
  initialTrainedDays: number[];
  todayYear: number;
  todayMonth1to12: number;
  todayDay: number;
}) {
  // Cache dos dias já carregados, por "ano-mês", começando pelo mês inicial (SSR).
  const cache = useRef(new Map<string, number[]>([[`${initialYear}-${initialMonth1to12}`, initialTrainedDays]]));
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth1to12);
  const [trainedDays, setTrainedDays] = useState<Set<number>>(new Set(initialTrainedDays));
  const [loading, setLoading] = useState(false);

  // Não deixa navegar para meses futuros (sem treinos possíveis).
  const isCurrentMonth = year === todayYear && month === todayMonth1to12;

  async function go(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    if (y > todayYear || (y === todayYear && m > todayMonth1to12)) return;

    setYear(y);
    setMonth(m);

    const key = `${y}-${m}`;
    const cached = cache.current.get(key);
    if (cached) {
      setTrainedDays(new Set(cached));
      return;
    }
    setLoading(true);
    const days = await getTrainedDays(y, m);
    cache.current.set(key, days);
    setTrainedDays(new Set(days));
    setLoading(false);
  }

  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={loading}
          aria-label="Mês anterior"
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-semibold">
          {MONTHS[month - 1]} de {year}
        </p>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={loading || isCurrentMonth}
          aria-label="Próximo mês"
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className={cn("grid grid-cols-7 gap-1 text-center transition-opacity", loading && "opacity-50")}>
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-[11px] font-medium text-muted-foreground">
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          const isToday = isCurrentMonth && d === todayDay;
          return (
            <div key={i} className="flex items-center justify-center py-0.5">
              {d == null ? (
                <span />
              ) : (
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full text-sm",
                    trainedDays.has(d)
                      ? "bg-primary font-semibold text-primary-foreground"
                      : isToday
                        ? "border border-primary text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {d}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
