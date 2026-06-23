import { cn } from "@/lib/utils";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function TrainingCalendar({
  year,
  month1to12,
  trainedDays,
  todayDay,
}: {
  year: number;
  month1to12: number;
  trainedDays: Set<number>;
  todayDay: number | null;
}) {
  const firstWeekday = new Date(year, month1to12 - 1, 1).getDay();
  const daysInMonth = new Date(year, month1to12, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <p className="mb-3 text-center text-sm font-semibold">
        {MONTHS[month1to12 - 1]} de {year}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-[11px] font-medium text-muted-foreground">
            {w}
          </div>
        ))}
        {cells.map((d, i) => (
          <div key={i} className="flex items-center justify-center py-0.5">
            {d == null ? (
              <span />
            ) : (
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full text-sm",
                  trainedDays.has(d)
                    ? "bg-primary font-semibold text-primary-foreground"
                    : d === todayDay
                      ? "border border-primary text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {d}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
