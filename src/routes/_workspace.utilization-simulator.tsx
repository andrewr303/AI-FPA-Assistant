import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/workspace/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { OperatingPrinciple } from "@/components/brand/operating-principle";
import { useCopilot } from "@/components/workspace/copilot-context";
import { Activity } from "lucide-react";
import { formatUsd, formatPct, formatNumber } from "@/lib/format";
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
} from "recharts";

export const Route = createFileRoute("/_workspace/utilization-simulator")({
  component: Page,
});

const COST_PER_ACTION = 0.041; // matches AI Sequencing GM in mock data

// Pareto-shaped action distribution. skew=0 → flat, skew=1 → 80/10 extreme.
function paretoDistribution(seats: number, mean: number, skew: number) {
  const buckets = 10;
  const out: { bucket: number; users: number; actions: number; total: number }[] = [];
  // exponent that controls heaviness; 0..1 → 0..3
  const a = 0.4 + skew * 2.6;
  // weights: bucket k gets w_k = (k+1)^(-a)
  const weights = Array.from({ length: buckets }, (_, k) => Math.pow(k + 1, -a));
  const wSum = weights.reduce((s, w) => s + w, 0);
  // share of *total* actions per bucket (descending)
  const shares = weights.map((w) => w / wSum);
  // per-bucket users: distribute seats evenly
  const usersPerBucket = Math.max(1, Math.round(seats / buckets));
  const totalActions = seats * mean;
  for (let k = 0; k < buckets; k++) {
    const bucketActions = totalActions * shares[k];
    const perUser = bucketActions / usersPerBucket;
    out.push({
      bucket: k + 1,
      users: usersPerBucket,
      actions: Math.round(perUser),
      total: Math.round(bucketActions),
    });
  }
  // sort descending by per-user actions ("whales" first)
  return out.sort((a, b) => b.actions - a.actions).map((r, i) => ({ ...r, bucket: i + 1 }));
}

function Page() {
  const copilot = useCopilot();
  const [seats, setSeats] = useState(100);
  const [mean, setMean] = useState(1500);
  const [skew, setSkew] = useState(0.7);
  const [capEnabled, setCapEnabled] = useState(true);
  const [cap, setCap] = useState(1500);
  const [overage, setOverage] = useState(0.04);

  const dist = useMemo(() => paretoDistribution(seats, mean, skew), [seats, mean, skew]);

  const stats = useMemo(() => {
    const totalActions = dist.reduce((s, d) => s + d.total, 0);
    const cost = totalActions * COST_PER_ACTION;
    let overageActions = 0;
    if (capEnabled) {
      for (const d of dist) {
        if (d.actions > cap) overageActions += (d.actions - cap) * d.users;
      }
    }
    const overageRevenue = overageActions * overage;
    const seatRevenue = seats * 350; // ~$4.2K/seat/yr → ~$350/mo
    const netContribution = seatRevenue + overageRevenue - cost;
    const blendedMargin =
      seatRevenue + overageRevenue > 0
        ? (netContribution / (seatRevenue + overageRevenue)) * 100
        : 0;
    const top10pctActions = dist.slice(0, 1).reduce((s, d) => s + d.total, 0);
    const top10pctShare = totalActions > 0 ? (top10pctActions / totalActions) * 100 : 0;
    return {
      totalActions,
      cost,
      overageActions,
      overageRevenue,
      seatRevenue,
      netContribution,
      blendedMargin,
      top10pctShare,
    };
  }, [dist, seats, capEnabled, cap, overage]);

  // 5-row what-if: % of customers blowing through cap
  const capScenarios = useMemo(() => {
    return [0, 25, 50, 75, 100].map((pct) => {
      const blowingActions = capEnabled
        ? dist.reduce((s, d) => s + Math.max(0, d.actions - cap) * d.users * (pct / 100), 0)
        : 0;
      const overageRev = blowingActions * overage;
      const overageCost = blowingActions * COST_PER_ACTION;
      return {
        pct,
        overageRev,
        overageCost,
        net: overageRev - overageCost,
      };
    });
  }, [dist, capEnabled, cap, overage]);

  return (
    <>
      <TopBar
        title="Utilization Simulator"
        subtitle="Seat × actions × whale-vs-casual distribution."
        onAskFinance={() => copilot.open()}
      />
      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1600px] w-full">
        <OperatingPrinciple principle="ask-why" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Inputs */}
          <Card className="p-5 bg-card lg:col-span-1 space-y-5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold">Inputs</div>
            </div>

            <SliderRow
              label="Seats"
              value={seats}
              suffix=""
              format={formatNumber}
              min={10}
              max={500}
              step={5}
              onChange={setSeats}
            />
            <SliderRow
              label="Mean actions / seat / mo"
              value={mean}
              suffix=""
              format={formatNumber}
              min={200}
              max={4000}
              step={50}
              onChange={setMean}
            />
            <SliderRow
              label="Distribution skew"
              value={skew}
              suffix=""
              format={(v) => v.toFixed(2)}
              min={0}
              max={1}
              step={0.05}
              onChange={setSkew}
              hint={skew < 0.3 ? "Even" : skew < 0.7 ? "Mild Pareto" : "Whale-heavy"}
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">Enforce cap</span>
              <Switch checked={capEnabled} onCheckedChange={setCapEnabled} />
            </div>

            {capEnabled && (
              <>
                <SliderRow
                  label="Cap (actions/seat/mo)"
                  value={cap}
                  suffix=""
                  format={formatNumber}
                  min={500}
                  max={3000}
                  step={50}
                  onChange={setCap}
                />
                <SliderRow
                  label="Overage rate"
                  value={overage}
                  suffix=""
                  format={(v) => `$${v.toFixed(2)}`}
                  min={0.02}
                  max={0.1}
                  step={0.005}
                  onChange={setOverage}
                />
              </>
            )}
          </Card>

          {/* Outputs */}
          <Card className="p-5 bg-card lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Total actions" value={formatNumber(stats.totalActions)} />
              <Stat label="Cost to serve" value={formatUsd(stats.cost)} />
              <Stat label="Overage rev" value={formatUsd(stats.overageRevenue)} />
              <Stat
                label="Blended margin"
                value={formatPct(stats.blendedMargin, 0)}
                tone={stats.blendedMargin >= 50 ? "success" : "destructive"}
              />
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={dist}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="bucket"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    label={{
                      value: "User decile (whales → casuals)",
                      position: "insideBottom",
                      offset: -2,
                      fill: "var(--muted-foreground)",
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    tickFormatter={(v: number) => formatNumber(v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: unknown) => formatNumber(Number(v))}
                  />
                  <Bar dataKey="actions" radius={[4, 4, 0, 0]}>
                    {dist.map((d, i) => (
                      <Cell
                        key={i}
                        fill={capEnabled && d.actions > cap ? "var(--chart-4)" : "var(--chart-1)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {capEnabled && (
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: "var(--chart-1)" }} />
                  Within cap
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: "var(--chart-4)" }} />
                  Over cap
                </span>
              </div>
            )}
          </Card>
        </div>

        {/* Cap scenarios */}
        {capEnabled && (
          <Card className="p-0 bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                What if X% of customers blow the cap?
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="text-left px-4 py-3">% blowing cap</th>
                  <th className="text-right px-4 py-3">Overage revenue</th>
                  <th className="text-right px-4 py-3">Cost-to-serve</th>
                  <th className="text-right px-4 py-3">Net contribution</th>
                </tr>
              </thead>
              <tbody>
                {capScenarios.map((s) => (
                  <tr key={s.pct} className="border-t border-border">
                    <td className="px-4 py-3 font-mono">{s.pct}%</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatUsd(s.overageRev)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatUsd(s.overageCost)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-mono tabular-nums",
                        s.net >= 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      {s.net >= 0 ? "+" : ""}
                      {formatUsd(s.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Big takeaway sentence */}
        <Card className="p-6 bg-linear-to-br from-accent/30 to-card border-primary/30">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
            Takeaway
          </div>
          <p className="text-base leading-relaxed">
            At {formatNumber(seats)} seats, mean {formatNumber(mean)} actions/seat, and Pareto skew{" "}
            <Badge variant="outline" className="font-mono">
              {skew.toFixed(2)}
            </Badge>
            , the top decile drives{" "}
            <span className="font-semibold text-foreground">{stats.top10pctShare.toFixed(0)}%</span>{" "}
            of usage.{" "}
            {capEnabled
              ? `With a ${formatNumber(cap)} cap and $${overage.toFixed(2)}/action overage, you net `
              : "Without a cap, you net "}
            <span
              className={cn(
                "font-semibold",
                stats.netContribution >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {stats.netContribution >= 0 ? "+" : ""}
              {formatUsd(stats.netContribution)}
            </span>{" "}
            on this cohort.
          </p>
        </Card>
      </div>
    </>
  );
}

function SliderRow({
  label,
  value,
  format,
  min,
  max,
  step,
  onChange,
  hint,
  suffix,
}: {
  label: string;
  value: number;
  format: (v: number) => string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint?: string;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-muted-foreground">{label}</label>
        <span className="text-xs font-mono tabular-nums">
          {format(value)}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "destructive";
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
        {label}
      </div>
      <div
        className={cn(
          "text-xl font-bold tabular-nums mt-1",
          tone === "success" && "text-success",
          tone === "destructive" && "text-destructive",
        )}
      >
        {value}
      </div>
    </div>
  );
}
