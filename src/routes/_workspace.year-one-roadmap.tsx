import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/workspace/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OperatingPrinciple } from "@/components/brand/operating-principle";
import { useCopilot } from "@/components/workspace/copilot-context";
import { CalendarClock, CircleCheckBig, CircleAlert } from "lucide-react";

export const Route = createFileRoute("/_workspace/year-one-roadmap")({
  component: Page,
});

const milestones = [
  { quarter: "Q1", theme: "Foundation", outcome: "Baseline observability + FinOps controls" },
  { quarter: "Q2", theme: "Scale", outcome: "Segment playbooks and model routing policy" },
  { quarter: "Q3", theme: "Expansion", outcome: "Cross-sell engine and renewal defense" },
  { quarter: "Q4", theme: "Durability", outcome: "Board-ready operating cadence" },
] as const;

function Page() {
  const copilot = useCopilot();

  return (
    <>
      <TopBar title="Year One Roadmap" subtitle="Quarterly execution sequence from pilot to scale." onAskFinance={() => copilot.open()} />
      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1600px] w-full">
        <OperatingPrinciple principle="do-more-with-less" />
        <Card className="p-5 bg-card">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Decision</div>
          <div className="text-base font-semibold mt-1">What sequence maximizes confidence while preserving cash discipline?</div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {milestones.map((m) => (
            <Card key={m.quarter} className="p-5 bg-card">
              <div className="flex items-center justify-between"><div className="font-semibold">{m.quarter} · {m.theme}</div><Badge variant="outline">milestone</Badge></div>
              <p className="text-sm text-muted-foreground mt-2">{m.outcome}</p>
            </Card>
          ))}
        </div>

        <Card className="p-5 bg-linear-to-br from-accent/30 to-card border-primary/30">
          <div className="flex items-start gap-3"><CalendarClock className="h-4 w-4 mt-0.5 text-primary" /><p className="text-sm">Keep sequence fixed: solve instrumentation before optimization, optimize before GTM acceleration.</p></div>
        </Card>

        <Card className="p-5 bg-card">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Monday action</div>
          <div className="flex items-start gap-2 text-sm"><CircleCheckBig className="h-4 w-4 text-success mt-0.5" />Publish 4-quarter scorecard with owner + KPI + risk for each milestone.</div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2"><CircleAlert className="h-4 w-4 text-warning mt-0.5" />Do not start Q2 scale work until Q1 observability SLO is green for 30 days.</div>
        </Card>
      </div>
    </>
  );
}
