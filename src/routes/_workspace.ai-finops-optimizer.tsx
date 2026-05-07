import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/workspace/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OperatingPrinciple } from "@/components/brand/operating-principle";
import { useCopilot } from "@/components/workspace/copilot-context";
import { CircleCheckBig, Sparkles, TriangleAlert } from "lucide-react";
import { formatUsd } from "@/lib/format";

export const Route = createFileRoute("/_workspace/ai-finops-optimizer")({
  component: Page,
});

const levers = [
  { name: "Prompt caching", current: 1_220_000, target: 790_000, confidence: "high" },
  { name: "Model routing", current: 2_040_000, target: 1_680_000, confidence: "medium" },
  { name: "Batch windows", current: 610_000, target: 430_000, confidence: "high" },
];

function Page() {
  const copilot = useCopilot();

  return (
    <>
      <TopBar
        title="AI FinOps Optimizer"
        subtitle="Token economics, routing policy, and burn efficiency."
        onAskFinance={() => copilot.open()}
      />
      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1600px] w-full">
        <OperatingPrinciple principle="simplify" />

        <Card className="p-5 bg-card">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Decision</div>
          <div className="text-base font-semibold mt-1">Which FinOps levers close a $1M quarterly COGS gap without harming quality SLA?</div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {levers.map((l) => (
            <Card key={l.name} className="p-5 bg-card">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{l.name}</div>
                <Badge variant="outline">{l.confidence}</Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <Row label="Current / qtr" value={formatUsd(l.current)} />
                <Row label="Target / qtr" value={formatUsd(l.target)} />
                <Row label="Savings" value={formatUsd(l.current - l.target)} />
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-5 bg-linear-to-br from-accent/30 to-card border-primary/30">
          <div className="flex items-start gap-3">
            <Sparkles className="h-4 w-4 mt-0.5 text-primary" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Recommendation</div>
              <p className="text-sm mt-1">Prioritize prompt caching + batch windows in Q3, then phase model routing behind latency guardrails in Q4.</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-card">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Monday action</div>
          <div className="flex items-start gap-2 text-sm">
            <CircleCheckBig className="h-4 w-4 text-success mt-0.5" />
            Enable cached-context policy for top 20 workflows and publish weekly savings dashboard.
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2">
            <TriangleAlert className="h-4 w-4 text-warning mt-0.5" />
            Watch for latent quality regressions on edge-case prompts during the first 2 weeks.
          </div>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className="font-mono tabular-nums">{value}</span></div>;
}
