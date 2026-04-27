import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/workspace/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OperatingPrinciple } from "@/components/brand/operating-principle";
import { useCopilot } from "@/components/workspace/copilot-context";
import { AlertTriangle, Bell, CheckCircle2, Info, MessageSquare } from "lucide-react";
import { alerts } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_workspace/signal-desk")({
  component: Page,
});

type Filter = "all" | "critical" | "warn" | "info";

const SEV_META = {
  critical: {
    stripe: "bg-destructive",
    badge: "border-destructive/40 text-destructive",
    icon: AlertTriangle,
    color: "text-destructive",
  },
  warn: {
    stripe: "bg-warning",
    badge: "border-warning/40 text-warning",
    icon: Bell,
    color: "text-warning",
  },
  info: {
    stripe: "bg-primary",
    badge: "border-primary/40 text-primary",
    icon: Info,
    color: "text-primary",
  },
} as const;

function Page() {
  const copilot = useCopilot();
  const [filter, setFilter] = useState<Filter>("all");
  const [resolved, setResolved] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => {
    return alerts
      .filter((a) => filter === "all" || a.severity === filter)
      .sort((a, b) => {
        const order = { critical: 0, warn: 1, info: 2 };
        return order[a.severity] - order[b.severity];
      });
  }, [filter]);

  const counts = useMemo(
    () => ({
      all: alerts.length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      warn: alerts.filter((a) => a.severity === "warn").length,
      info: alerts.filter((a) => a.severity === "info").length,
    }),
    [],
  );

  return (
    <>
      <TopBar
        title="Signal Desk"
        subtitle="Anomaly alerts inbox. The salesfloor for finance."
        onAskFinance={() => copilot.open()}
      />
      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1600px] w-full">
        <OperatingPrinciple principle="earn-customer-love" />

        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "critical", "warn", "info"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs uppercase tracking-widest font-semibold border transition-colors",
                f === filter
                  ? "bg-primary/15 border-primary/40 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {f} <span className="opacity-60 ml-1">({counts[f]})</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <Card className="p-10 bg-card border-dashed text-center text-muted-foreground">
              No signals yet. The salesfloor is quiet — try ingesting a CSV or wait for the next
              sweep.
            </Card>
          )}
          {filtered.map((a) => {
            const meta = SEV_META[a.severity];
            const Icon = meta.icon;
            const isResolved = resolved.has(a.id);
            return (
              <Card
                key={a.id}
                className={cn(
                  "relative overflow-hidden p-5 bg-card flex gap-4",
                  isResolved && "opacity-50",
                )}
              >
                <div className={cn("absolute left-0 top-0 bottom-0 w-1", meta.stripe)} />
                <div className="ml-1 shrink-0">
                  <Icon className={cn("h-5 w-5", meta.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className={cn("font-mono text-[10px]", meta.badge)}>
                      {a.severity.toUpperCase()}
                    </Badge>
                    {a.metric && (
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {a.metric}
                      </Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground">{a.triggeredAt}</span>
                  </div>
                  <div className="font-semibold text-sm">{a.title}</div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.message}</p>
                  {a.threshold !== null && a.actual !== null && (
                    <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground font-mono">
                      <span>
                        Threshold:{" "}
                        <span className="text-foreground">{a.threshold?.toLocaleString()}</span>
                      </span>
                      <span>
                        Actual:{" "}
                        <span className="text-foreground">{a.actual?.toLocaleString()}</span>
                      </span>
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        copilot.open(`Explain this alert: ${a.title}. Driver notes: ${a.message}`)
                      }
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Run a play
                    </button>
                    {!isResolved && (
                      <button
                        type="button"
                        onClick={() => setResolved((prev) => new Set(prev).add(a.id))}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark resolved
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
