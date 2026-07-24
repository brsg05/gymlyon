"use client";

import { useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import { Card, CardContent } from "@/components/ui/card";
import { LineAreaChart } from "@/components/charts/line-area-chart";
import { nf, intf } from "@/lib/utils";

type Metric = "carga" | "e1rm" | "volume";

export type EvolutionPoint = {
  label: string;
  carga: number;
  e1rm: number;
  volume: number;
};

const META: Record<
  Metric,
  { tab: string; recordLabel: string; chartLabel: string; unit: string; integer?: boolean }
> = {
  carga: { tab: "Carga", recordLabel: "Recorde de carga", chartLabel: "Carga máxima por sessão", unit: "kg" },
  e1rm: { tab: "1RM", recordLabel: "Recorde de 1RM estimado", chartLabel: "1RM estimado por sessão", unit: "kg" },
  volume: { tab: "Volume", recordLabel: "Maior volume", chartLabel: "Volume por sessão", unit: "kg", integer: true },
};

export function ExerciseEvolution({ points, sessionCount }: { points: EvolutionPoint[]; sessionCount: number }) {
  const [metric, setMetric] = useState<Metric>("carga");
  const m = META[metric];

  const record = points.reduce((mx, p) => Math.max(mx, p[metric]), 0);
  const chart = points.map((p) => ({ label: p.label, value: p[metric] }));

  return (
    <>
      <Segmented
        options={[
          { value: "carga", label: META.carga.tab },
          { value: "e1rm", label: META.e1rm.tab },
          { value: "volume", label: META.volume.tab },
        ]}
        value={metric}
        onChange={setMetric}
      />

      <Card>
        <CardContent className="flex items-end justify-between py-4">
          <div>
            <p className="text-sm text-muted-foreground">{m.recordLabel}</p>
            <p className="text-3xl font-bold">
              {m.integer ? intf(record) : nf(record, 1)}{" "}
              <span className="text-base font-medium text-muted-foreground">{m.unit}</span>
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{sessionCount} sessões</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          {metric === "e1rm" ? (
            <p className="mb-0.5 text-sm font-medium text-muted-foreground">{m.chartLabel}</p>
          ) : (
            <p className="mb-2 text-sm font-medium text-muted-foreground">{m.chartLabel}</p>
          )}
          {metric === "e1rm" ? (
            <p className="mb-2 text-xs text-muted-foreground">Estimativa de Epley: peso × (1 + reps/30)</p>
          ) : null}
          <LineAreaChart data={chart} unit={` ${m.unit}`} />
        </CardContent>
      </Card>
    </>
  );
}
