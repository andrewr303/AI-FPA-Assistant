import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/workspace/top-bar";
import { Card } from "@/components/ui/card";
import { OperatingPrinciple } from "@/components/brand/operating-principle";
import { useCopilot } from "@/components/workspace/copilot-context";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_workspace/utilization-simulator")({
  component: Page,
});

const TITLES: Record<
  string,
  {
    title: string;
    subtitle: string;
    principle: "ask-why" | "do-more-with-less" | "earn-customer-love";
  }
> = {
  "sequencing-margin-lab": {
    title: "Sequencing Margin Lab",
    subtitle:
      "Cost-per-action calculator for AI Sequencing. We can do anything but not everything.",
    principle: "do-more-with-less",
  },
  "utilization-simulator": {
    title: "Utilization Simulator",
    subtitle: "Seat × actions × whale-vs-casual distribution.",
    principle: "ask-why",
  },
  "vendor-portfolio": {
    title: "Vendor Portfolio",
    subtitle: "4-vendor model bake-off. Eliminate the toggle tax.",
    principle: "ask-why",
  },
  "pricing-plays": {
    title: "Pricing Plays",
    subtitle: "Cap & overage scenario modeling.",
    principle: "do-more-with-less",
  },
  "arr-waterfall": {
    title: "ARR Waterfall",
    subtitle: "New + expansion − contraction − churn + overage.",
    principle: "earn-customer-love",
  },
  "variance-narrator": {
    title: "Variance Narrator",
    subtitle: "AI-authored exec commentary on close variance.",
    principle: "ask-why",
  },
  "headcount-plays": {
    title: "Headcount Plays",
    subtitle: "Capacity vs revenue plan by department.",
    principle: "do-more-with-less",
  },
  "forecast-confidence": {
    title: "Forecast Confidence",
    subtitle: "Forecast vs actual — the learning loop.",
    principle: "ask-why",
  },
  "signal-desk": {
    title: "Signal Desk",
    subtitle: "Anomaly alerts inbox. The salesfloor for finance.",
    principle: "ask-why",
  },
  copilot: {
    title: "Ask Finance",
    subtitle: "Your FP&A agent, full-screen.",
    principle: "earn-customer-love",
  },
};

function Page() {
  const copilot = useCopilot();
  const meta = TITLES["utilization-simulator"];
  return (
    <>
      <TopBar title={meta.title} subtitle={meta.subtitle} onAskFinance={() => copilot.open()} />
      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1600px] w-full">
        <OperatingPrinciple principle={meta.principle} />
        <Card className="p-10 bg-card border-dashed border-border flex flex-col items-center justify-center text-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="text-lg font-semibold">{meta.title} — module loading</div>
          <p className="text-sm text-muted-foreground max-w-md">
            Scaffolded. Ask the agent to populate this module, or request the full build-out in a
            follow-up message.
          </p>
          <button
            onClick={() =>
              copilot.open(`Walk me through the ${meta.title} module — what should I build here?`)
            }
            className="mt-2 text-xs text-primary hover:underline"
          >
            Ask the agent →
          </button>
        </Card>
      </div>
    </>
  );
}
