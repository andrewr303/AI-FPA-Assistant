import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/workspace/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OperatingPrinciple } from "@/components/brand/operating-principle";
import { useCopilot } from "@/components/workspace/copilot-context";
import { headcountByDept, headcountSeries, arrSeries } from "@/lib/mock/data";
import { formatUsd, formatNumber, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/_workspace/headcount-plays")({
  component: Page,
});

type Scenario = "baseline" | "upside" | "downside";

const SCENARIO_DELTA: Record<Scenario, number> = {
  baseline: 0,
  upside: 0.2, // +20% headcount
  downside: -0.1, // -10%
};

// AE ramp cohorts: rows are start-month, columns are ramp month % attainment
const RAMP_COHORTS = [
  { cohort: "2025-10", attain: [12, 28, 47, 68, 81, 92] },
  { cohort: "2025-11", attain: [10, 24, 42, 61, 76, 88] },
  { cohort: "2025-12", attain: [8, 22, 38, 55, 70, null] },
  { cohort: "2026-01", attain: [9, 19, 35, 52, null, null] },
  { cohort: "2026-02", attain: [11, 24, 41, null, null, null] },
  { cohort: "2026-03", attain: [9, 21, null, null, null, null] },
];

const RAMP_TARGETS = [15, 30, 50, 70, 85, 100];

function rampColor(actual: number | null, target: number) {
  if (actual === null) return "bg-secondary/30 text-muted-foreground";
  const ratio = actual / target;
  if (ratio >= 0.95) return "bg-success/20 text-success border-success/40";
  if (ratio >= 0.8) return "bg-warning/20 text-warning border-warning/40";
  return "bg-destructive/20 text-destructive border-destructive/40";
}

function Page() {
  const copilot = useCopilot();
  const [scenario, setScenario] = useState<Scenario>("baseline");

  const delta = SCENARIO_DELTA[scenario];

  // Stacked area: synthesize 12 months by scaling current dept mix on the headcount trajectory
  const stacked = useMemo(() => {
    return headcountSeries.map((h, i) => {
      const totalNow = h.value * (1 + delta * (i / headcountSeries.length));
      const ratioBase = headcountByDept.reduce((s, d) => s + d.fte, 0);
      const point: Record<string, number | string> = { month: h.month };
      for (const d of headcountByDept) {
        point[d.dept] = Math.round((d.fte / ratioBase) * totalNow);
      }
      return point;
    });
  }, [delta]);

  // Revenue per employee using ARR / headcount
  const revPerEmp = useMemo(() => {
    return arrSeries.map((a, i) => {
      const hc = headcountSeries[i]?.value ?? 1;
      const adjustedHc = hc * (1 + delta * (i / arrSeries.length));
      return {
        month: a.month,
        rpe: a.value / adjustedHc,
      };
    });
  }, [delta]);

  const latestHc = (headcountSeries.at(-1)?.value ?? 0) * (1 + delta);
  const latestRpe = (arrSeries.at(-1)?.value ?? 0) / latestHc;

  return (
    <>
      <TopBar
        title="Headcount Plays"
        subtitle="Capacity vs revenue plan by department."
        onAskFinance={() => copilot.open()}
      />
      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1600px] w-full">
        <OperatingPrinciple principle="do-more-with-less" />

        {/* Scenario toggle */}
        <Card className="p-5 bg-card flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            {(["baseline", "upside", "downside"] as Scenario[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScenario(s)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs uppercase tracking-widest font-semibold border transition-colors",
                  s === scenario
                    ? "bg-primary/15 border-primary/40 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-6 text-xs">
            <Stat label="Total FTE" value={formatNumber(latestHc, 0)} />
            <Stat label="ARR / employee" value={formatUsd(latestRpe)} />
            <Stat
              label="HC delta vs baseline"
              value={`${delta >= 0 ? "+" : ""}${formatPct(delta * 100, 0)}`}
              tone={delta < 0 ? "destructive" : "neutral"}
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Headcount build chart */}
          <Card className="p-5 bg-card">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
              Headcount build · by department
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={stacked}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(v: string) => v.slice(2, 7)}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  {headcountByDept.map((d, i) => (
                    <Area
                      key={d.dept}
                      type="monotone"
                      dataKey={d.dept}
                      stackId="hc"
                      stroke={`var(--chart-${i + 1})`}
                      fill={`var(--chart-${i + 1})`}
                      fillOpacity={0.5}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-3 flex-wrap mt-3 text-xs">
              {headcountByDept.map((d, i) => (
                <span key={d.dept} className="flex items-center gap-1.5 text-muted-foreground">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: `var(--chart-${i + 1})` }}
                  />
                  {d.dept}
                </span>
              ))}
            </div>
          </Card>

          {/* Revenue per employee */}
          <Card className="p-5 bg-card">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
              ARR per employee · vs benchmarks
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={revPerEmp}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(v: string) => v.slice(2, 7)}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: unknown) => formatUsd(Number(v))}
                  />
                  <ReferenceLine
                    y={330_000}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="3 3"
                    label={{
                      value: "$330K SaaS median",
                      position: "right",
                      fill: "var(--muted-foreground)",
                      fontSize: 10,
                    }}
                  />
                  <ReferenceLine
                    y={500_000}
                    stroke="var(--chart-2)"
                    strokeDasharray="3 3"
                    label={{
                      value: "$500K AI top-Q",
                      position: "right",
                      fill: "var(--chart-2)",
                      fontSize: 10,
                    }}
                  />
                  <ReferenceLine
                    y={1_000_000}
                    stroke="var(--primary)"
                    strokeDasharray="3 3"
                    label={{
                      value: "$1M Cursor-class",
                      position: "right",
                      fill: "var(--primary)",
                      fontSize: 10,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rpe"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Department FTE / cost breakdown */}
        <Card className="p-0 bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Department breakdown
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground text-[10px] uppercase tracking-widest">
              <tr>
                <th className="text-left px-4 py-3">Department</th>
                <th className="text-right px-4 py-3">FTE</th>
                <th className="text-right px-4 py-3">Fully-loaded cost</th>
                <th className="text-right px-4 py-3">Cost / FTE</th>
                <th className="text-right px-4 py-3">% of total</th>
              </tr>
            </thead>
            <tbody>
              {headcountByDept.map((d, i) => {
                const totalFte = headcountByDept.reduce((s, x) => s + x.fte, 0);
                const adjFte = Math.round(d.fte * (1 + delta));
                const adjCost = d.cost * (1 + delta);
                return (
                  <tr key={d.dept} className="border-t border-border">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: `var(--chart-${i + 1})` }}
                      />
                      {d.dept}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatNumber(adjFte)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatUsd(adjCost)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                      {formatUsd(d.cost / d.fte)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatPct((d.fte / totalFte) * 100, 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* AE ramp risk table */}
        <Card className="p-0 bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                AE ramp risk
              </div>
              <div className="text-sm font-semibold mt-0.5">
                Cohorts targeting $1M quota · attainment % by ramp month
              </div>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Targets: {RAMP_TARGETS.map((t) => `${t}%`).join(" · ")}
            </Badge>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground text-[10px] uppercase tracking-widest">
              <tr>
                <th className="text-left px-4 py-3">Cohort</th>
                {RAMP_TARGETS.map((_, i) => (
                  <th key={i} className="text-center px-3 py-3">
                    M{i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RAMP_COHORTS.map((c) => (
                <tr key={c.cohort} className="border-t border-border">
                  <td className="px-4 py-3 font-mono">{c.cohort}</td>
                  {c.attain.map((a, i) => (
                    <td key={i} className="px-2 py-2 text-center">
                      <span
                        className={cn(
                          "inline-block w-full px-2 py-1 rounded font-mono text-xs border",
                          rampColor(a, RAMP_TARGETS[i]),
                        )}
                      >
                        {a === null ? "—" : `${a}%`}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "destructive";
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={cn(
          "font-mono tabular-nums text-base",
          tone === "destructive" && "text-destructive",
        )}
      >
        {value}
      </div>
    </div>
  );
}
