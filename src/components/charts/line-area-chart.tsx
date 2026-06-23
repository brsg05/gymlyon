"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface Point {
  label: string;
  value: number;
}

export function LineAreaChart({
  data,
  color = "var(--primary)",
  unit = "",
  height = 200,
}: {
  data: Point[];
  color?: string;
  unit?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          minTickGap={16}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={44}
          domain={["auto", "auto"]}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--card)",
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--muted-foreground)" }}
          formatter={(v) => [`${v}${unit}`, ""]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          fill="url(#fill)"
          dot={{ r: 2.5, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
