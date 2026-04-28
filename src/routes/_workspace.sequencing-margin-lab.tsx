import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/workspace/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { OperatingPrinciple } from "@/components/brand/operating-principle";
import { useCopilot } from "@/components/workspace/copilot-context";
import { models, computeCostPerAction } from "@/lib/mock/data";
import { formatUsd, formatPct, formatNumber } from "@/lib/format";
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
  AlertTriangle,
  Info,
  RotateCcw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_workspace/sequencing-margin-lab")({
  component: Page,
});

type Scenario = {
  tokensIn: number;
  tokensOut: number;
  cacheHitRate: number; // 0..1
  routingOverheadPct: number;
  discountPct: number;
  vendorMix: { openai: number; anthropic: number; google: number; deepseek: number };
};

const PLAN: Scenario = {
  tokensIn: 28_000,
  tokensOut: 4_200,
  cacheHitRate: 0.35,
  routingOverheadPct: 6,
  discountPct: 20,
  vendorMix: { openai: 0.64, anthropic: 0.28, google: 0.06, deepseek: 0.02 },
};

const PRESETS: { name: string; desc: string; scenario: Scenario }[] = [
  {
    name: "Current mix",
    desc: "Today — OpenAI-heavy, 35% cache hits. This is the miss.",
    scenario: PLAN,
  },
  {
    name: "Rebalance to Sonnet",
    desc: "Anthropic 60% on coding-agent flows. Board commitment compliant.",
    scenario: {
      ...PLAN,
      cacheHitRate: 0.5,
      vendorMix: { openai: 0.3, anthropic: 0.6, google: 0.07, deepseek: 0.03 },
    },
  },
  {
    name: "Aggressive cache + Haiku",
    desc: "70% cache, small-model routing. Quality trade-off on complex prospects.",
    scenario: {
      ...PLAN,
      tokensIn: 22_000,
      cacheHitRate: 0.7,
      vendorMix: { openai: 0.25, anthropic: 0.5, google: 0.15, deepseek: 0.1 },
    },
  },
  {
    name: "DeepSeek floor",
    desc: "Push DeepSeek to 25% for background enrichment tasks.",
    scenario: {
      ...PLAN,
      cacheHitRate: 0.45,
      vendorMix: { openai: 0.35, anthropic: 0.35, google: 0.05, deepseek: 0.25 },
    },
  },
];

// Pricing envelope per Sequencing seat
const SEAT_PRICE = 150; // $/seat/month
const ACTIONS_PER_SEAT = 1500; // plan cap
const SEATS = 14_200;

function Page() {
  const copilot = useCopilot();
  const [scenario, setScenario] = useState<Scenario>(PLAN);
  const [actionsPerSeat, setActionsPerSeat] = useState(ACTIONS_PER_SEAT);

  const planCost = useMemo(
    () =>
      computeCostPerAction({
        tokensIn: PLAN.tokensIn,
        tokensOut: PLAN.tokensOut,
        cacheHitRate: PLAN.cacheHitRate,
        vendorMix: PLAN.vendorMix,
        discountPct: PLAN.discountPct,
        routingOverheadPct: PLAN.routingOverheadPct,
      }),
    [],
  );
  const cost = useMemo(
    () =>
      computeCostPerAction({
        tokensIn: scenario.tokensIn,
        tokensOut: scenario.tokensOut,
        cacheHitRate: scenario.cacheHitRate,
        vendorMix: scenario.vendorMix,
        discountPct: scenario.discountPct,
        routingOverheadPct: scenario.routingOverheadPct,
      }),
    [scenario],
  );

  const costPerAction = cost.total;
  const costPerActionPlan = planCost.total;
  const delta = costPerAction - costPerActionPlan;
  const deltaPct = (delta / costPerActionPlan) * 100;

  const monthlyActions = SEATS * actionsPerSeat;
  const monthlyCogs = monthlyActions * costPerAction;
  const monthlyRevenue = SEATS * SEAT_PRICE;
  const gm = ((monthlyRevenue - monthlyCogs) / monthlyRevenue) * 100;
  const planMonthlyCogs = monthlyActions * costPerActionPlan;
  const monthlySavings = planMonthlyCogs - monthlyCogs;
  const annualSavings = monthlySavings * 12;

  const vendorSum =
    scenario.vendorMix.openai +
    scenario.vendorMix.anthropic +
    scenario.vendorMix.google +
    scenario.vendorMix.deepseek;
  const vendorOk = Math.abs(vendorSum - 1) < 0.01;

  // Per-vendor breakdown for chart
  const vendorBreakdown = useMemo(() => {
    return Object.entries(scenario.vendorMix).map(([vendor, share]) => {
      const single = computeCostPerAction({
        tokensIn: scenario.tokensIn,
        tokensOut: scenario.tokensOut,
        cacheHitRate: scenario.cacheHitRate,
        vendorMix: { [vendor]: 1 } as Record<string, number>,
        discountPct: scenario.discountPct,
        routingOverheadPct: scenario.routingOverheadPct,
      });
      const contribution = single.total * share;
      return {
        vendor: vendor.charAt(0).toUpperCase() + vendor.slice(1),
        rawPerAction: single.total,
        share,
        contribution,
      };
    });
  }, [scenario]);

  // Cache-hit sensitivity curve
  const cacheCurve = useMemo(() => {
    return Array.from({ length: 11 }, (_, i) => {
      const hit = i / 10;
      const c = computeCostPerAction({
        ...scenario,
        cacheHitRate: hit,
      });
      return { cache: `${(hit * 100).toFixed(0)}%`, cost: +c.total.toFixed(4) };
    });
  }, [scenario]);

  function updateVendor(key: keyof Scenario["vendorMix"], val: number) {
    const others = (Object.keys(scenario.vendorMix) as (keyof Scenario["vendorMix"])[]).filter(
      (k) => k !== key,
    );
    const remaining = 1 - val;
    const currentOthers = others.reduce((s, k) => s + scenario.vendorMix[k], 0);
    const scaled: Scenario["vendorMix"] = { ...scenario.vendorMix, [key]: val };
    if (currentOthers > 0) {
      for (const k of others) {
        scaled[k] = (scenario.vendorMix[k] / currentOthers) * remaining;
      }
    } else {
      for (const k of others) scaled[k] = remaining / others.length;
    }
    setScenario({ ...scenario, vendorMix: scaled });
  }

  function applyPreset(p: Scenario) {
    setScenario(p);
  }

  return (
    <>
      <TopBar
        title="Sequencing Margin Lab"
        subtitle="Cost-per-action calculator for AI Sequencing. We can do anything but not everything."
        onAskFinance={() =>
          copilot.open(
            `I'm in Sequencing Margin Lab. Current scenario yields $${costPerAction.toFixed(4)}/action and ${gm.toFixed(1)}% GM. Plan was $${costPerActionPlan.toFixed(4)}. What levers should I pull to hit 65% GM?`,
          )
        }
      />

      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1600px] w-full">
        <OperatingPrinciple principle="do-more-with-less" />

        {/* Outcome strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <OutcomeTile
            label="Cost / action"
            value={`$${costPerAction.toFixed(4)}`}
            delta={deltaPct}
            hint={`plan $${costPerActionPlan.toFixed(4)}`}
          />
          <OutcomeTile
            label="Sequencing GM"
            value={`${gm.toFixed(1)}%`}
            delta={gm - 54}
            hint="target 65%"
            invertDelta
          />
          <OutcomeTile
            label="Monthly COGS"
            value={formatUsd(monthlyCogs)}
            delta={((monthlyCogs - planMonthlyCogs) / planMonthlyCogs) * 100}
            hint={`${formatNumber(monthlyActions)} actions`}
          />
          <OutcomeTile
            label="Annualized savings"
            value={formatUsd(annualSavings)}
            delta={null}
            hint={monthlySavings >= 0 ? "vs plan scenario" : "adds cost vs plan"}
            emphasize
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <Card className="p-5 lg:col-span-1 space-y-5 h-fit">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Scenario inputs</div>
                <div className="text-xs text-muted-foreground mt-0.5">Per-action assumptions</div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setScenario(PLAN)}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumField
                label="Tokens in / action"
                value={scenario.tokensIn}
                onChange={(v) => setScenario({ ...scenario, tokensIn: v })}
                step={500}
              />
              <NumField
                label="Tokens out / action"
                value={scenario.tokensOut}
                onChange={(v) => setScenario({ ...scenario, tokensOut: v })}
                step={100}
              />
            </div>

            <SliderField
              label="Cache hit rate"
              value={scenario.cacheHitRate * 100}
              onChange={(v) => setScenario({ ...scenario, cacheHitRate: v / 100 })}
              suffix="%"
              max={90}
            />
            <SliderField
              label="Committed-spend discount"
              value={scenario.discountPct}
              onChange={(v) => setScenario({ ...scenario, discountPct: v })}
              suffix="%"
              max={35}
            />
            <SliderField
              label="Routing / retry overhead"
              value={scenario.routingOverheadPct}
              onChange={(v) => setScenario({ ...scenario, routingOverheadPct: v })}
              suffix="%"
              max={25}
            />
            <SliderField
              label="Actions / seat / month"
              value={actionsPerSeat}
              onChange={setActionsPerSeat}
              suffix=""
              max={3000}
              step={50}
            />

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">Vendor mix</div>
                <Badge
                  variant="outline"
                  className={
                    vendorOk
                      ? "text-[10px] border-emerald-500/40 text-emerald-400"
                      : "text-[10px] border-amber-500/40 text-amber-400"
                  }
                >
                  {(vendorSum * 100).toFixed(0)}%
                </Badge>
              </div>
              <div className="space-y-3">
                <VendorSlider
                  label="OpenAI"
                  value={scenario.vendorMix.openai}
                  onChange={(v) => updateVendor("openai", v)}
                  warnAbove={0.6}
                />
                <VendorSlider
                  label="Anthropic"
                  value={scenario.vendorMix.anthropic}
                  onChange={(v) => updateVendor("anthropic", v)}
                />
                <VendorSlider
                  label="Google"
                  value={scenario.vendorMix.google}
                  onChange={(v) => updateVendor("google", v)}
                />
                <VendorSlider
                  label="DeepSeek"
                  value={scenario.vendorMix.deepseek}
                  onChange={(v) => updateVendor("deepseek", v)}
                />
              </div>
              {scenario.vendorMix.openai > 0.6 && (
                <div className="mt-3 flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-[11px] text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Breaches 60% single-vendor concentration cap from Series B deck.
                </div>
              )}
            </div>
          </Card>

          {/* Right column — breakdown + charts */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold">Cost breakdown per action</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Where the {`$${costPerAction.toFixed(4)}`} goes
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {formatUsd(SEATS * SEAT_PRICE)}/mo revenue
                </Badge>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart
                    data={vendorBreakdown}
                    margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="vendor"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                      axisLine={{ stroke: "var(--border)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                      tickFormatter={(v) => `$${(v as number).toFixed(4)}`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "color-mix(in oklab, var(--primary) 8%, transparent)" }}
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: unknown) => `$${Number(v).toFixed(5)}`}
                    />
                    <Bar dataKey="contribution" radius={[6, 6, 0, 0]}>
                      {vendorBreakdown.map((_, i) => (
                        <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {vendorBreakdown.map((v) => (
                  <div
                    key={v.vendor}
                    className="rounded-lg border border-border bg-background/40 px-3 py-2"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {v.vendor}
                    </div>
                    <div className="text-sm font-mono mt-0.5">${v.contribution.toFixed(5)}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatPct(v.share * 100, 0)} • ${v.rawPerAction.toFixed(4)} raw
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold">Cache-hit sensitivity</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Every 10 pp of cache hit ≈{" "}
                    {formatPct(
                      ((cacheCurve[0].cost - cacheCurve[10].cost) / cacheCurve[0].cost) * 10,
                      1,
                    )}{" "}
                    cost reduction
                  </div>
                </div>
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart data={cacheCurve} margin={{ top: 8, right: 20, left: 8, bottom: 8 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="cache"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                      axisLine={{ stroke: "var(--border)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                      tickFormatter={(v) => `$${(v as number).toFixed(4)}`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }}
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: unknown) => `$${Number(v).toFixed(5)}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="cost"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "var(--primary)", stroke: "var(--primary)" }}
                      activeDot={{ r: 5, fill: "var(--primary)", stroke: "var(--background)", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>

        {/* Scenario presets */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Scenario presets</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                One-click strategies the margin team is evaluating
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESETS.map((p) => {
              const c = computeCostPerAction({
                tokensIn: p.scenario.tokensIn,
                tokensOut: p.scenario.tokensOut,
                cacheHitRate: p.scenario.cacheHitRate,
                vendorMix: p.scenario.vendorMix,
                discountPct: p.scenario.discountPct,
                routingOverheadPct: p.scenario.routingOverheadPct,
              });
              const presetGm =
                ((monthlyRevenue - SEATS * actionsPerSeat * c.total) / monthlyRevenue) * 100;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p.scenario)}
                  className="text-left rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{p.name}</div>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono border-primary/30 text-primary"
                    >
                      {presetGm.toFixed(0)}% GM
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{p.desc}</div>
                  <div className="text-[11px] font-mono text-foreground/80 pt-1 border-t border-border/50">
                    ${c.total.toFixed(4)} / action
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Model reference */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Model reference prices</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Per 1M tokens, list price before committed-spend discounts (Apr 2026)
              </div>
            </div>
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4 font-medium">Model</th>
                  <th className="py-2 pr-4 font-medium">Vendor</th>
                  <th className="py-2 pr-4 font-medium text-right">Input</th>
                  <th className="py-2 pr-4 font-medium text-right">Cached</th>
                  <th className="py-2 pr-4 font-medium text-right">Output</th>
                  <th className="py-2 pr-4 font-medium text-right">Quality</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {models.map((m) => (
                  <tr key={m.modelName} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4">{m.modelName}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{m.vendor}</td>
                    <td className="py-2 pr-4 text-right">${m.inputPrice.toFixed(2)}</td>
                    <td className="py-2 pr-4 text-right text-emerald-400">
                      ${m.cachedInputPrice.toFixed(3)}
                    </td>
                    <td className="py-2 pr-4 text-right">${m.outputPrice.toFixed(2)}</td>
                    <td className="py-2 pr-4 text-right">{m.quality.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Agent nudge */}
        <Card className="p-5 bg-linear-to-br from-primary/10 via-primary/5 to-transparent border-primary/30">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Ask the margin agent</div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Current scenario: {`$${costPerAction.toFixed(4)}`}/action, {gm.toFixed(1)}% GM. The
                agent can narrate trade-offs, write the board talking points, or draft the vendor
                rebalance email.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copilot.open(
                      `Write a 3-bullet margin recap for the board. Current scenario: $${costPerAction.toFixed(4)}/action, ${gm.toFixed(1)}% Sequencing GM, ${formatUsd(monthlyCogs)} monthly COGS. Plan was $${costPerActionPlan.toFixed(4)}.`,
                    )
                  }
                  className="text-xs"
                >
                  Board recap
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copilot.open(
                      `What's the fastest path from ${gm.toFixed(1)}% Sequencing GM to 65%? Be specific about vendor mix, cache rate, and routing decisions.`,
                    )
                  }
                  className="text-xs"
                >
                  Path to 65% GM
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copilot.open(
                      `Draft the email to the infra team to shift Sequencing coding-agent flows from Opus 4.7 to Sonnet 4.6. Include the expected cost/action change.`,
                    )
                  }
                  className="text-xs"
                >
                  Draft rebalance email
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

function OutcomeTile({
  label,
  value,
  delta,
  hint,
  invertDelta,
  emphasize,
}: {
  label: string;
  value: string;
  delta: number | null;
  hint: string;
  invertDelta?: boolean;
  emphasize?: boolean;
}) {
  const isUp = delta !== null && delta > 0;
  const good = invertDelta ? isUp : !isUp;
  return (
    <Card
      className={`p-4 ${
        emphasize ? "bg-linear-to-br from-primary/15 to-transparent border-primary/40" : ""
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1 font-mono tracking-tight">{value}</div>
      <div className="flex items-center gap-1.5 mt-1">
        {delta !== null && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
              good ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)}
            {label.includes("GM") ? " pp" : "%"}
          </span>
        )}
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </div>
    </Card>
  );
}

function NumField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-8 text-xs font-mono"
      />
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  suffix,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix: string;
  max: number;
  step?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] text-muted-foreground">{label}</Label>
        <span className="text-xs font-mono">
          {value.toFixed(step < 1 ? 2 : 0)}
          {suffix}
        </span>
      </div>
      <Slider value={[value]} min={0} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

function VendorSlider({
  label,
  value,
  onChange,
  warnAbove,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  warnAbove?: number;
}) {
  const pct = value * 100;
  const warn = warnAbove !== undefined && value > warnAbove;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] text-muted-foreground">{label}</Label>
        <span className={`text-xs font-mono ${warn ? "text-amber-400" : ""}`}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <Slider
        value={[pct]}
        min={0}
        max={100}
        step={1}
        onValueChange={(v) => onChange(v[0] / 100)}
      />
    </div>
  );
}
