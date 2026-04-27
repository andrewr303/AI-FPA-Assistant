import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/workspace/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OperatingPrinciple } from "@/components/brand/operating-principle";
import { useCopilot } from "@/components/workspace/copilot-context";
import { arrWaterfall, varianceRecords, arrSeries } from "@/lib/mock/data";
import { formatUsd, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from "recharts";

export const Route = createFileRoute("/_workspace/arr-waterfall")({
  component: Page,
});

type Row = (typeof arrWaterfall)[number];

// Build cumulative bars for waterfall: each bar plotted as [base, top]
function waterfallSeries(rows: Row[]) {
  let running = 0;
  return rows.map((r) => {
    if (r.type === "start") {
      running = r.value;
      return { ...r, base: 0, top: r.value, total: r.value };
    }
    if (r.type === "end") {
      return { ...r, base: 0, top: r.value, total: r.value };
    }
    const start = running;
    running += r.value;
    const lo = Math.min(start, running);
    const hi = Math.max(start, running);
    return { ...r, base: lo, top: hi, total: r.value };
  });
}

const PERIODS = ["2026-01", "2026-02", "2026-03"] as const;
const LINE_ITEMS = ["new_arr", "expansion", "churn", "llm_cogs", "salaries"] as const;

function Page() {
  const copilot = useCopilot();
  const [segment, setSegment] = useState<"all" | "enterprise" | "mid_market" | "smb">("all");

  const series = useMemo(() => waterfallSeries(arrWaterfall), []);

  // Pivot variance records into a {lineItem × period} sticky table
  const tableRows = useMemo(() => {
    return LINE_ITEMS.map((li) => {
      const cells = PERIODS.map((p) => {
        const rec = varianceRecords.find(
          (r) =>
            r.lineItem === li &&
            r.period === p &&
            (segment === "all" || r.segment === segment || r.segment === null),
        );
        return rec
          ? {
              actual: rec.actual,
              plan: rec.plan,
              deltaPct: ((rec.actual - rec.plan) / rec.plan) * 100,
            }
          : null;
      });
      return { lineItem: li, cells };
    });
  }, [segment]);

  return (
    <>
      <TopBar
        title="ARR Waterfall"
        subtitle="New + expansion − contraction − churn + overage."
        onAskFinance={() => copilot.open()}
      />
      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1600px] w-full">
        <OperatingPrinciple principle="earn-customer-love" />

        {/* Filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mr-2">
            Segment
          </span>
          {(["all", "enterprise", "mid_market", "smb"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSegment(s)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-mono transition-colors border",
                s === segment
                  ? "bg-primary/15 border-primary/40 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Hero waterfall */}
        <Card className="p-5 bg-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Q1 2026 ARR waterfall
              </div>
              <div className="text-base font-semibold mt-1">
                {formatUsd(arrWaterfall[0].value)} → {formatUsd(arrWaterfall.at(-1)!.value)}
              </div>
            </div>
            <Badge variant="outline" className="border-success/40 text-success">
              +{formatUsd(arrWaterfall.at(-1)!.value - arrWaterfall[0].value)}
            </Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(0)}M`}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(_v, _name, payload) => {
                    const d = payload.payload as Row;
                    return [formatUsd(d.value), d.label];
                  }}
                />
                {/* invisible base */}
                <Bar dataKey="base" stackId="w" fill="transparent" />
                <Bar dataKey="top" stackId="w" radius={[4, 4, 0, 0]}>
                  {series.map((d, i) => {
                    let color = "var(--chart-1)";
                    if (d.type === "up") color = "var(--success)";
                    else if (d.type === "down") color = "var(--destructive)";
                    else if (d.type === "end") color = "var(--primary)";
                    return <Cell key={i} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ARR trajectory */}
        <Card className="p-5 bg-card">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
            12-month ARR trajectory
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={arrSeries}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(v: string) => v.slice(2, 7)}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <YAxis
                  tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(0)}M`}
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
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Sticky variance table */}
        <Card className="p-0 bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Variance by line item · last 3 months
            </div>
          </div>
          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground text-[10px] uppercase tracking-widest sticky top-0 z-10">
                <tr>
                  <th className="text-left px-4 py-3 sticky left-0 bg-secondary/95 z-20 backdrop-blur">
                    Line item
                  </th>
                  {PERIODS.map((p) => (
                    <th
                      key={p}
                      colSpan={3}
                      className="text-center px-4 py-3 border-l border-border"
                    >
                      {p}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="px-4 py-2 sticky left-0 bg-secondary/95 z-20 backdrop-blur" />
                  {PERIODS.map((p) => (
                    <ThreeHead key={p} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.lineItem} className="border-t border-border">
                    <td className="px-4 py-3 font-medium sticky left-0 bg-card z-10 backdrop-blur">
                      {row.lineItem}
                    </td>
                    {row.cells.map((c, i) => {
                      if (!c)
                        return (
                          <td
                            key={i}
                            colSpan={3}
                            className="px-4 py-3 text-center text-muted-foreground border-l border-border"
                          >
                            —
                          </td>
                        );
                      const isCost =
                        row.lineItem === "llm_cogs" ||
                        row.lineItem === "salaries" ||
                        row.lineItem === "churn";
                      const favorable = isCost ? c.deltaPct <= 0 : c.deltaPct >= 0;
                      return (
                        <>
                          <td
                            key={`${i}-p`}
                            className="px-4 py-3 text-right font-mono tabular-nums border-l border-border"
                          >
                            {formatUsd(c.plan)}
                          </td>
                          <td
                            key={`${i}-a`}
                            className="px-4 py-3 text-right font-mono tabular-nums"
                          >
                            {formatUsd(c.actual)}
                          </td>
                          <td key={`${i}-d`} className={cn("px-4 py-3 text-right")}>
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-mono text-[10px]",
                                favorable
                                  ? "border-success/40 text-success"
                                  : "border-destructive/40 text-destructive",
                                Math.abs(c.deltaPct) > 10 && "font-semibold",
                              )}
                            >
                              {formatPct(c.deltaPct)}
                            </Badge>
                          </td>
                        </>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

function ThreeHead() {
  return (
    <>
      <th className="px-4 py-2 text-right text-[10px] font-medium text-muted-foreground border-l border-border">
        Plan
      </th>
      <th className="px-4 py-2 text-right text-[10px] font-medium text-muted-foreground">Actual</th>
      <th className="px-4 py-2 text-right text-[10px] font-medium text-muted-foreground">Δ</th>
    </>
  );
}
