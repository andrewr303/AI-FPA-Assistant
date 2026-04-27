import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/workspace/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OperatingPrinciple } from "@/components/brand/operating-principle";
import { useCopilot } from "@/components/workspace/copilot-context";
import { Sparkles, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { forecastHistory } from "@/lib/mock/data";
import { forecastExplainer } from "@/lib/ai/copilot.functions";
import { formatUsd, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

export const Route = createFileRoute("/_workspace/forecast-confidence")({
  component: Page,
});

function Page() {
  const copilot = useCopilot();
  const [explanation, setExplanation] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const newArrSeries = useMemo(() => forecastHistory.filter((r) => r.lineItem === "new_arr"), []);
  const cogsSeries = useMemo(() => forecastHistory.filter((r) => r.lineItem === "llm_cogs"), []);
  const missSeries = useMemo(
    () =>
      forecastHistory.map((r) => ({
        period: r.period,
        lineItem: r.lineItem,
        absMiss: Math.abs(r.missPct),
      })),
    [],
  );

  const arrAccuracy = useMemo(() => {
    const m = newArrSeries.reduce((s, r) => s + Math.abs(r.missPct), 0) / newArrSeries.length;
    return 100 - m;
  }, [newArrSeries]);
  const cogsAccuracy = useMemo(() => {
    const m = cogsSeries.reduce((s, r) => s + Math.abs(r.missPct), 0) / cogsSeries.length;
    return 100 - m;
  }, [cogsSeries]);

  async function explain() {
    setBusy(true);
    setExplanation(null);
    try {
      const r = await forecastExplainer(forecastHistory);
      setExplanation(r.reply);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopBar
        title="Forecast Confidence"
        subtitle="Forecast vs actual — the learning loop."
        onAskFinance={() => copilot.open()}
      />
      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1600px] w-full">
        <OperatingPrinciple principle="ask-why" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CalibrationCard
            label="New ARR forecast accuracy"
            accuracy={arrAccuracy}
            improving
            note="Sequencing pipeline is settling — model is learning."
          />
          <CalibrationCard
            label="LLM COGS forecast accuracy"
            accuracy={cogsAccuracy}
            improving={false}
            note="Degrading — Opus 4.7 tokenizer change broke our token model."
          />
        </div>

        <Card className="p-5 bg-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                New ARR · forecast (dotted) vs actual (solid)
              </div>
              <div className="text-base font-semibold mt-1">
                Trailing 5 months · {formatPct(arrAccuracy, 1)} accuracy
              </div>
            </div>
            <Badge variant="outline" className="border-success/40 text-success gap-1">
              <TrendingUp className="h-3 w-3" /> Improving
            </Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={newArrSeries}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <YAxis
                  tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(1)}M`}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: unknown) => formatUsd(Number(v))}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Forecast"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--chart-1)" }}
                  name="Actual"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 bg-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                LLM COGS · forecast (dotted) vs actual (solid)
              </div>
              <div className="text-base font-semibold mt-1">
                Trailing 5 months · {formatPct(cogsAccuracy, 1)} accuracy
              </div>
            </div>
            <Badge variant="outline" className="border-destructive/40 text-destructive gap-1">
              <TrendingDown className="h-3 w-3" /> Degrading
            </Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={cogsSeries}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <YAxis
                  tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(1)}M`}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: unknown) => formatUsd(Number(v))}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Forecast"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="var(--chart-4)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--chart-4)" }}
                  name="Actual"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 bg-card">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
            Miss % by period
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <ComposedChart data={missSeries}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <YAxis
                  tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: unknown) => `${Number(v).toFixed(1)}%`}
                />
                <Bar dataKey="absMiss" radius={[4, 4, 0, 0]}>
                  {missSeries.map((m, i) => (
                    <Cell
                      key={i}
                      fill={m.lineItem === "llm_cogs" ? "var(--chart-4)" : "var(--chart-1)"}
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--chart-1)" }} />
              new_arr
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--chart-4)" }} />
              llm_cogs
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-card flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Why is our LLM cost forecast getting worse?
            </div>
            <p className="text-sm mt-1 max-w-md text-muted-foreground">
              The agent reads the calibration history and writes one paragraph for the board.
            </p>
          </div>
          <Button type="button" onClick={explain} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Reasoning…" : "Explain it"}
          </Button>
        </Card>

        {explanation && (
          <Card className="p-6 bg-linear-to-br from-accent/30 to-card border-primary/30">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-linear-to-br from-primary to-primary/40 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <p className="text-sm leading-relaxed flex-1">{explanation}</p>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

function CalibrationCard({
  label,
  accuracy,
  improving,
  note,
}: {
  label: string;
  accuracy: number;
  improving: boolean;
  note: string;
}) {
  return (
    <Card className="p-5 bg-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            {label}
          </div>
          <div className="text-3xl font-bold tabular-nums mt-2">{formatPct(accuracy, 1)}</div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "gap-1",
            improving ? "border-success/40 text-success" : "border-destructive/40 text-destructive",
          )}
        >
          {improving ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {improving ? "Improving" : "Degrading"}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{note}</p>
    </Card>
  );
}
