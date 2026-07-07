import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type KpiFormat = "usd" | "pct" | "multiple" | "months" | "number";

export function KpiCard({
  label,
  value,
  delta,
  format,
  series,
  invertDelta = false,
  onClick,
  hint,
}: {
  label: string;
  value: string;
  delta: number; // percent
  format: KpiFormat;
  series: { month: string; value: number }[];
  invertDelta?: boolean;
  onClick?: () => void;
  hint?: string;
}) {
  const up = delta >= 0;
  // For metrics like burn or cac_payback, up is bad.
  const favorable = invertDelta ? !up : up;
  const deltaColor = favorable ? "text-success" : "text-destructive";
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  const chartId = useId().replace(/:/g, "");
  const values = series.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  const padding = range === 0 ? Math.max(Math.abs(maxValue) * 0.08, 1) : range * 0.35;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden p-5 bg-card border-border glass-interactive cursor-pointer",
        "hover:border-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          {label}
        </div>
        <div className={cn("flex items-center gap-0.5 text-xs font-mono tabular-nums", deltaColor)}>
          <Arrow className="h-3 w-3" />
          {Math.abs(delta).toFixed(1)}%
        </div>
      </div>
      <div className="text-3xl font-bold tabular-nums tracking-tight mb-1">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mb-2">{hint}</div>}
      <div className="h-10 -mx-1 mt-2 overflow-hidden rounded-sm">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 4, right: 0, bottom: 2, left: 0 }}>
            <defs>
              <linearGradient id={`spark-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.42} />
                <stop offset="85%" stopColor="var(--chart-1)" stopOpacity={0.06} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={[minValue - padding, maxValue + padding]} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--chart-1)"
              strokeWidth={1.8}
              fill={`url(#spark-${chartId})`}
              fillOpacity={1}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
