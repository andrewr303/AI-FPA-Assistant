import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/workspace/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OperatingPrinciple } from "@/components/brand/operating-principle";
import { useCopilot } from "@/components/workspace/copilot-context";
import { Sparkles, Loader2, AlertTriangle, TrendingUp, Target, ShieldAlert } from "lucide-react";
import { varianceRecords } from "@/lib/mock/data";
import { varianceBrief, type Brief } from "@/lib/ai/copilot.functions";
import { formatUsd, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_workspace/variance-narrator")({
  component: Page,
});

const PERIODS = ["2026-01", "2026-02", "2026-03"] as const;

function Page() {
  const copilot = useCopilot();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("2026-03");
  const [brief, setBrief] = useState<Brief | null>(null);
  const [busy, setBusy] = useState(false);

  const records = useMemo(() => varianceRecords.filter((r) => r.period === period), [period]);

  const totals = useMemo(() => {
    const actual = records.reduce((s, r) => s + r.actual, 0);
    const plan = records.reduce((s, r) => s + r.plan, 0);
    return { actual, plan, deltaPct: plan ? ((actual - plan) / plan) * 100 : 0 };
  }, [records]);

  async function generate() {
    setBusy(true);
    setBrief(null);
    try {
      const res = await varianceBrief({ data: { period } });
      setBrief(res);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopBar
        title="Variance Narrator"
        subtitle="AI-authored exec commentary on close variance."
        onAskFinance={() => copilot.open()}
      />
      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1600px] w-full">
        <OperatingPrinciple principle="ask-why" />

        {/* Period picker + summary */}
        <Card className="p-5 bg-card flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p);
                  setBrief(null);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-mono transition-colors border",
                  p === period
                    ? "bg-primary/15 border-primary/40 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-6 text-xs">
            <div>
              <div className="text-muted-foreground uppercase tracking-widest text-[10px]">
                Actual
              </div>
              <div className="font-mono tabular-nums text-base">{formatUsd(totals.actual)}</div>
            </div>
            <div>
              <div className="text-muted-foreground uppercase tracking-widest text-[10px]">
                Plan
              </div>
              <div className="font-mono tabular-nums text-base">{formatUsd(totals.plan)}</div>
            </div>
            <div>
              <div className="text-muted-foreground uppercase tracking-widest text-[10px]">
                Variance
              </div>
              <div
                className={cn(
                  "font-mono tabular-nums text-base",
                  totals.deltaPct >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {formatPct(totals.deltaPct)}
              </div>
            </div>
            <Button onClick={generate} disabled={busy} className="gap-2">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {busy ? "Reasoning…" : "Generate exec brief"}
            </Button>
          </div>
        </Card>

        {/* Variance table */}
        <Card className="p-0 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground text-[10px] uppercase tracking-widest">
              <tr>
                <th className="text-left px-4 py-3">Line item</th>
                <th className="text-left px-4 py-3">Segment</th>
                <th className="text-right px-4 py-3">Plan</th>
                <th className="text-right px-4 py-3">Actual</th>
                <th className="text-right px-4 py-3">Δ</th>
                <th className="text-left px-4 py-3">Driver</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => {
                const delta = r.actual - r.plan;
                const deltaPct = (delta / r.plan) * 100;
                const isCost =
                  r.lineItem === "llm_cogs" || r.lineItem === "salaries" || r.lineItem === "churn";
                const favorable = isCost ? delta <= 0 : delta >= 0;
                return (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{r.lineItem}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {r.segment ?? "blended"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatUsd(r.plan)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatUsd(r.actual)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-mono tabular-nums",
                        favorable ? "text-success" : "text-destructive",
                      )}
                    >
                      {delta >= 0 ? "+" : ""}
                      {formatUsd(delta)} ({formatPct(deltaPct)})
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-md">{r.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* AI Brief */}
        {brief && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="lg:col-span-2 p-6 bg-linear-to-br from-accent/30 to-card border-primary/30">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-linear-to-br from-primary to-primary/40 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                    Headline · {period}
                  </div>
                  <p className="text-lg font-semibold leading-snug">{brief.headline}</p>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-card">
              <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                <TrendingUp className="h-3.5 w-3.5" /> Drivers
              </div>
              <div className="space-y-2.5">
                {brief.drivers.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{d.name}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-mono",
                        d.direction === "favorable"
                          ? "border-success/40 text-success"
                          : "border-destructive/40 text-destructive",
                      )}
                    >
                      {d.impact_usd >= 0 ? "+" : ""}
                      {formatUsd(d.impact_usd)}
                    </Badge>
                  </div>
                ))}
                {brief.drivers.length === 0 && (
                  <p className="text-xs text-muted-foreground">No drivers returned.</p>
                )}
              </div>
            </Card>

            <Card className="p-5 bg-card">
              <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                <ShieldAlert className="h-3.5 w-3.5" /> Risks
              </div>
              <ul className="space-y-2 text-sm">
                {brief.risks.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{r}</span>
                  </li>
                ))}
                {brief.risks.length === 0 && (
                  <li className="text-xs text-muted-foreground">No risks flagged.</li>
                )}
              </ul>
            </Card>

            <Card className="lg:col-span-2 p-5 bg-card">
              <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                <Target className="h-3.5 w-3.5" /> Recommendations
              </div>
              <ul className="space-y-2 text-sm">
                {brief.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary font-mono">{i + 1}.</span>
                    <span>{rec}</span>
                  </li>
                ))}
                {brief.recommendations.length === 0 && (
                  <li className="text-xs text-muted-foreground">No recommendations returned.</li>
                )}
              </ul>
              {brief.error && (
                <p className="text-[11px] text-warning mt-4">
                  AI Gateway unavailable — configure server-side <code>AI_GATEWAY_API_KEY</code> for
                  live AI commentary.
                </p>
              )}
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
