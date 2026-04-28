import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/workspace/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OperatingPrinciple } from "@/components/brand/operating-principle";
import { useCopilot } from "@/components/workspace/copilot-context";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  XCircle,
} from "lucide-react";
import { vendors, models, vendorMixCurrent } from "@/lib/mock/data";
import { vendorRollout, type VendorRollout } from "@/lib/ai/copilot.functions";
import { formatUsd, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export const Route = createFileRoute("/_workspace/vendor-portfolio")({
  component: Page,
});

const VENDOR_COLOR: Record<string, string> = {
  openai: "var(--chart-1)",
  anthropic: "var(--chart-2)",
  google: "var(--chart-3)",
  deepseek: "var(--chart-4)",
};

function costPerAction(m: (typeof models)[number]) {
  const blendedIn = 0.35 * m.cachedInputPrice + 0.65 * m.inputPrice;
  return ((2400 / 1_000_000) * blendedIn + (800 / 1_000_000) * m.outputPrice) * 1.1;
}

function Page() {
  const copilot = useCopilot();
  const [rec, setRec] = useState<VendorRollout | null>(null);
  const [busy, setBusy] = useState(false);

  const scatter = useMemo(
    () =>
      models.map((m) => ({
        ...m,
        costPerAction: costPerAction(m),
      })),
    [],
  );

  const concentration = vendorMixCurrent.find((m) => m.share > 60);

  async function getRec() {
    setBusy(true);
    setRec(null);
    try {
      const r = await vendorRollout(
        scatter.map((m) => ({
          vendor: m.vendor,
          model_name: m.modelName,
          cost_per_action_usd: m.costPerAction,
          quality_score: m.quality,
        })),
        vendorMixCurrent.map((m) => ({ vendor: m.vendor, share: m.share })),
      );
      setRec(r);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopBar
        title="Vendor Portfolio"
        subtitle="4-vendor model bake-off. Eliminate the toggle tax."
        onAskFinance={() => copilot.open()}
      />
      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1600px] w-full">
        <OperatingPrinciple principle="ask-why" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {vendors.map((v) => {
            const vModels = models.filter((m) => m.vendor === v.name);
            const avgCost =
              vModels.reduce((s, m) => s + costPerAction(m), 0) / Math.max(vModels.length, 1);
            const avgQuality =
              vModels.reduce((s, m) => s + m.quality, 0) / Math.max(vModels.length, 1);
            return (
              <Card key={v.name} className="p-5 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-base font-semibold">{v.display}</div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      v.status === "active"
                        ? "border-success/40 text-success"
                        : "border-warning/40 text-warning",
                    )}
                  >
                    {v.status}
                  </Badge>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {vModels.slice(0, 3).map((m) => (
                    <div key={m.modelName} className="flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: VENDOR_COLOR[v.name] }}
                      />
                      <span>{m.modelName}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Cost/action
                    </div>
                    <div className="font-mono tabular-nums">${avgCost.toFixed(4)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Quality
                    </div>
                    <div className="font-mono tabular-nums">{avgQuality.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Commit
                    </div>
                    <div className="font-mono tabular-nums">{formatUsd(v.committedSpend)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Discount
                    </div>
                    <div className="font-mono tabular-nums">{formatPct(v.discount, 0)}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="p-5 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Cost vs Quality
              </div>
              <div className="text-base font-semibold mt-1">
                {models.length} models · Pareto frontier in violet
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="costPerAction"
                  name="Cost/action"
                  tickFormatter={(v: number) => `$${v.toFixed(4)}`}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="quality"
                  name="Quality"
                  domain={[70, 100]}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <ZAxis range={[80, 80]} />
                <Tooltip
                  cursor={{ stroke: "var(--border)" }}
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v, name) => {
                    if (name === "Cost/action") return `$${Number(v).toFixed(4)}`;
                    return Number(v).toFixed(1);
                  }}
                  labelFormatter={(_l, p) =>
                    (p?.[0]?.payload as { modelName?: string })?.modelName ?? ""
                  }
                />
                <Scatter data={scatter}>
                  {scatter.map((m, i) => (
                    <Cell key={i} fill={VENDOR_COLOR[m.vendor]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3 flex-wrap text-xs">
            {Object.entries(VENDOR_COLOR).map(([v, c]) => (
              <div key={v} className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: c }} />
                <span className="capitalize">{v}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Inference COGS by vendor
              </div>
              <div className="text-base font-semibold mt-1">Vendor concentration risk</div>
            </div>
            {concentration && (
              <Badge variant="outline" className="border-warning/40 text-warning gap-1">
                <AlertTriangle className="h-3 w-3" />
                {concentration.vendor} at {concentration.share}% — Ask Why
              </Badge>
            )}
          </div>
          <div className="flex h-8 rounded-md overflow-hidden border border-border">
            {vendorMixCurrent.map((v, i) => (
              <div
                key={v.vendor}
                className="flex items-center justify-center text-[11px] font-mono text-foreground/90"
                style={{
                  width: `${v.share}%`,
                  background: `var(--chart-${i + 1})`,
                  opacity: 0.7,
                }}
                title={`${v.vendor}: ${v.share}%`}
              >
                {v.share >= 8 ? `${v.share}%` : ""}
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            {vendorMixCurrent.map((v) => (
              <span key={v.vendor}>{v.vendor}</span>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-card flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Rollout decision
            </div>
            <p className="text-sm mt-1 max-w-md text-muted-foreground">
              Ask the agent which models to scale, pilot, or deprecate based on the cost/quality
              frontier and current concentration risk.
            </p>
          </div>
          <Button type="button" onClick={getRec} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Reasoning…" : "Generate rollout"}
          </Button>
        </Card>

        {rec && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RolloutCol icon={CheckCircle2} title="Scale" tone="success" items={rec.scale} />
            <RolloutCol icon={FlaskConical} title="Pilot" tone="warning" items={rec.pilot} />
            <RolloutCol icon={XCircle} title="Deprecate" tone="destructive" items={rec.deprecate} />
            <Card className="md:col-span-3 p-5 bg-linear-to-br from-accent/30 to-card border-primary/30">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                Rationale
              </div>
              <p className="text-sm leading-relaxed">{rec.rationale}</p>
              {rec.concentration_warning && (
                <div className="mt-3 flex items-start gap-2 text-xs text-warning">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{rec.concentration_warning}</span>
                </div>
              )}
              {rec.error && (
                <p className="text-[11px] text-warning mt-3">
                  AI Gateway unavailable — configure server-side <code>AI_GATEWAY_API_KEY</code>{" "}
                  for live AI rollout.
                </p>
              )}
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

function RolloutCol({
  icon: Icon,
  title,
  tone,
  items,
}: {
  icon: typeof CheckCircle2;
  title: string;
  tone: "success" | "warning" | "destructive";
  items: string[];
}) {
  const toneClass =
    tone === "success"
      ? "text-success border-success/40"
      : tone === "warning"
        ? "text-warning border-warning/40"
        : "text-destructive border-destructive/40";
  return (
    <Card className="p-5 bg-card">
      <div className={cn("flex items-center gap-2 mb-3", toneClass.split(" ")[0])}>
        <Icon className="h-4 w-4" />
        <div className="text-sm font-semibold">{title}</div>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">None.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((m) => (
            <li
              key={m}
              className={cn(
                "text-xs font-mono px-2 py-1 rounded border bg-background/50",
                toneClass,
              )}
            >
              {m}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
