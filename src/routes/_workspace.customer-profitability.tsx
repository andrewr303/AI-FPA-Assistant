import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/workspace/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OperatingPrinciple } from "@/components/brand/operating-principle";
import { useCopilot } from "@/components/workspace/copilot-context";
import { ArrowUpRight, CircleAlert, CircleCheckBig } from "lucide-react";
import { formatPct, formatUsd } from "@/lib/format";

export const Route = createFileRoute("/_workspace/customer-profitability")({
  component: Page,
});

const segments = [
  { name: "Enterprise", arr: 91_000_000, grossMargin: 74, supportLoad: 12, status: "expand" },
  { name: "Mid-market", arr: 52_000_000, grossMargin: 61, supportLoad: 19, status: "stabilize" },
  { name: "SMB", arr: 28_000_000, grossMargin: 44, supportLoad: 33, status: "repair" },
] as const;

function Page() {
  const copilot = useCopilot();

  return (
    <>
      <TopBar
        title="Customer Profitability"
        subtitle="Margin quality by segment and support intensity."
        onAskFinance={() => copilot.open()}
      />
      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1600px] w-full">
        <OperatingPrinciple principle="do-more-with-less" />

        <Card className="p-5 bg-card">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Decision</div>
          <div className="text-base font-semibold mt-1">Shift CSM pods toward SMB repair or defend enterprise expansion?</div>
          <p className="text-sm text-muted-foreground mt-2">Current mix over-invests in low-margin cohorts and drags blended contribution margin.</p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {segments.map((s) => (
            <Card key={s.name} className="p-5 bg-card">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold">{s.name}</div>
                <Badge variant="outline">{s.status}</Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <Row label="ARR" value={formatUsd(s.arr)} />
                <Row label="Gross margin" value={formatPct(s.grossMargin, 0)} />
                <Row label="Support load" value={`${s.supportLoad} hrs / $10k ARR`} />
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-5 bg-linear-to-br from-accent/30 to-card border-primary/30">
          <div className="flex items-start gap-3">
            <ArrowUpRight className="h-4 w-4 mt-0.5 text-primary" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Recommendation</div>
              <p className="text-sm mt-1">Rebalance 2 CSM pods from enterprise to SMB for 90 days and gate expansion credits on ≥58% segment margin.</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-card">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Monday action</div>
          <div className="flex items-start gap-2 text-sm">
            <CircleCheckBig className="h-4 w-4 text-success mt-0.5" />
            Publish segment-level service tiers and freeze bespoke support for SMB accounts under $50k ARR.
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2">
            <CircleAlert className="h-4 w-4 text-warning mt-0.5" />
            Risk: temporary NPS dip while onboarding automation replaces manual touches.
          </div>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}
