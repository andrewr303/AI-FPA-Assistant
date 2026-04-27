import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/workspace/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OperatingPrinciple } from "@/components/brand/operating-principle";
import { useCopilot } from "@/components/workspace/copilot-context";
import { Sparkles, Loader2, Trophy, AlertTriangle } from "lucide-react";
import {
  pricingRecommendation,
  type PricingPlay,
  type PricingRec,
} from "@/lib/ai/copilot.functions";
import { formatUsd, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_workspace/pricing-plays")({
  component: Page,
});

const PLAYS: PricingPlay[] = [
  {
    id: "per_seat",
    name: "Pure per-seat",
    pricing_model: "per_seat",
    list_price_per_seat_usd: 4800,
    projected_arr_y1_usd: 168_000_000,
    projected_gm_pct: 64,
    projected_nrr_pct: 112,
    rule_of_40_score: 44,
  },
  {
    id: "hybrid",
    name: "Hybrid (cap + overage)",
    pricing_model: "hybrid",
    cap_actions_per_seat: 1500,
    overage_rate_usd: 0.04,
    list_price_per_seat_usd: 4200,
    projected_arr_y1_usd: 198_000_000,
    projected_gm_pct: 58,
    projected_nrr_pct: 124,
    rule_of_40_score: 52,
  },
  {
    id: "usage",
    name: "Pure usage",
    pricing_model: "usage",
    overage_rate_usd: 0.05,
    list_price_per_seat_usd: 0,
    projected_arr_y1_usd: 152_000_000,
    projected_gm_pct: 56,
    projected_nrr_pct: 138,
    rule_of_40_score: 41,
  },
];

function Page() {
  const copilot = useCopilot();
  const [rec, setRec] = useState<PricingRec | null>(null);
  const [busy, setBusy] = useState(false);

  async function getRec() {
    setBusy(true);
    setRec(null);
    try {
      const r = await pricingRecommendation(PLAYS);
      setRec(r);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopBar
        title="Pricing Plays"
        subtitle="Cap & overage scenario modeling."
        onAskFinance={() => copilot.open()}
      />
      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1600px] w-full">
        <OperatingPrinciple principle="do-more-with-less" />

        {/* Plays grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLAYS.map((p) => {
            const isBest = rec?.recommended_id === p.id;
            return (
              <Card
                key={p.id}
                className={cn(
                  "p-5 bg-card relative",
                  isBest && "border-primary/60 bg-gradient-to-br from-accent/30 to-card",
                )}
              >
                {isBest && (
                  <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground gap-1">
                    <Trophy className="h-3 w-3" /> Recommended
                  </Badge>
                )}
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  {p.pricing_model.replace("_", " ")}
                </div>
                <div className="text-lg font-semibold mt-1">{p.name}</div>

                <div className="mt-4 space-y-2 text-sm">
                  <Row
                    label="List / seat"
                    value={p.list_price_per_seat_usd ? formatUsd(p.list_price_per_seat_usd) : "—"}
                  />
                  {p.cap_actions_per_seat && (
                    <Row label="Cap" value={`${p.cap_actions_per_seat.toLocaleString()} actions`} />
                  )}
                  {p.overage_rate_usd && (
                    <Row label="Overage" value={`$${p.overage_rate_usd.toFixed(2)}/action`} />
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 text-sm">
                  <Stat label="Y1 ARR" value={formatUsd(p.projected_arr_y1_usd)} />
                  <Stat label="GM" value={formatPct(p.projected_gm_pct, 0)} />
                  <Stat label="NRR" value={formatPct(p.projected_nrr_pct, 0)} />
                  <Stat label="R40" value={p.rule_of_40_score.toFixed(0)} />
                </div>
              </Card>
            );
          })}
        </div>

        {/* AI rec button + result */}
        <Card className="p-5 bg-card flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Agent recommendation
            </div>
            <p className="text-sm mt-1 max-w-md text-muted-foreground">
              Ask the agent to weigh these three plays against Rule-of-40, NRR, and gross-margin
              targets and pick a winner.
            </p>
          </div>
          <Button onClick={getRec} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Reasoning…" : "Get recommendation"}
          </Button>
        </Card>

        {rec && (
          <Card className="p-6 bg-gradient-to-br from-accent/30 to-card border-primary/30">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center shrink-0">
                <Trophy className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                  Recommended
                </div>
                <div className="text-xl font-semibold mb-3">
                  {PLAYS.find((p) => p.id === rec.recommended_id)?.name ?? rec.recommended_id}
                </div>
                <p className="text-sm leading-relaxed">{rec.rationale}</p>
                {rec.risks.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/60">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                      Risks
                    </div>
                    <ul className="space-y-1.5 text-sm">
                      {rec.risks.map((r, i) => (
                        <li key={i} className="flex gap-2 text-muted-foreground">
                          <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {rec.error && (
                  <p className="text-[11px] text-warning mt-4">
                    Demo mode — set <code>VITE_COPILOT_API_URL</code> for live AI rationale.
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Comparison table */}
        <Card className="p-0 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground text-[10px] uppercase tracking-widest">
              <tr>
                <th className="text-left px-4 py-3">Metric</th>
                {PLAYS.map((p) => (
                  <th key={p.id} className="text-right px-4 py-3">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Pricing model", (p: PricingPlay) => p.pricing_model.replace("_", " ")],
                [
                  "List / seat",
                  (p: PricingPlay) =>
                    p.list_price_per_seat_usd ? formatUsd(p.list_price_per_seat_usd) : "—",
                ],
                ["Y1 projected ARR", (p: PricingPlay) => formatUsd(p.projected_arr_y1_usd)],
                ["Gross margin", (p: PricingPlay) => formatPct(p.projected_gm_pct, 0)],
                ["NRR", (p: PricingPlay) => formatPct(p.projected_nrr_pct, 0)],
                ["Rule of 40", (p: PricingPlay) => p.rule_of_40_score.toFixed(0)],
              ].map(([label, fn]) => (
                <tr key={label as string} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-muted-foreground">{label as string}</td>
                  {PLAYS.map((p) => (
                    <td key={p.id} className="text-right px-4 py-3 font-mono tabular-nums">
                      {(fn as (p: PricingPlay) => string)(p)}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-mono tabular-nums font-semibold">{value}</div>
    </div>
  );
}
