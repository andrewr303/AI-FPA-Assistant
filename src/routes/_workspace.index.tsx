import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/workspace/top-bar";
import { KpiCard } from "@/components/workspace/kpi-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OperatingPrinciple } from "@/components/brand/operating-principle";
import { useCopilot } from "@/components/workspace/copilot-context";
import {
  arrSeries,
  nrrSeries,
  gmSeries,
  burnSeries,
  magicSeries,
  cacPaybackSeries,
  ruleOf40Series,
  headcountSeries,
  llmCogsSeries,
  alerts,
  arrByProduct,
  vendorMixCurrent,
} from "@/lib/mock/data";
import { formatUsd, formatPct, formatMultiple, formatMonths, formatNumber } from "@/lib/format";

const tipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
} as const;
const fmtUsdTip = (v: unknown) => formatUsd(Number(v));
const fmtPctTip = (v: unknown) => `${Number(v).toFixed(0)}%`;
const fmtUsdOrPct = (v: unknown, name: unknown) =>
  name === "arr" ? formatUsd(Number(v)) : `${Number(v)}%`;
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip,
  BarChart, Bar, Cell, PieChart, Pie,
} from "recharts";
import { AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_workspace/")({
  component: Treasury,
});

function deltaOf(series: { value: number }[]) {
  if (series.length < 4) return 0;
  const last = series.at(-1)!.value;
  const prev = series.at(-4)!.value;
  return ((last - prev) / prev) * 100;
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function Treasury() {
  const copilot = useCopilot();
  const arr = arrSeries.at(-1)!.value;
  const nrr = nrrSeries.at(-1)!.value;
  const gm = gmSeries.at(-1)!.value;
  const burn = burnSeries.at(-1)!.value;
  const magic = magicSeries.at(-1)!.value;
  const cac = cacPaybackSeries.at(-1)!.value;
  const r40 = ruleOf40Series.at(-1)!.value;
  const hc = headcountSeries.at(-1)!.value;
  const cogs = llmCogsSeries.at(-1)!.value;

  const criticalAlerts = alerts.filter((a) => a.severity === "critical");

  return (
    <>
      <TopBar
        title="Agent Workspace for Treasury"
        subtitle="The loop between LLM cost, usage, pricing, and the forecast — all in one place."
        onAskFinance={() => copilot.open()}
      />
      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1600px] w-full">
        <OperatingPrinciple principle="ask-why" />

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <KpiCard
            label="ARR"
            value={formatUsd(arr)}
            delta={deltaOf(arrSeries)}
            format="usd"
            series={arrSeries}
            hint="6× since Series B"
            onClick={() => copilot.open("Why did ARR move this much in the last 90 days?")}
          />
          <KpiCard
            label="NRR"
            value={formatPct(nrr)}
            delta={deltaOf(nrrSeries)}
            format="pct"
            series={nrrSeries}
            onClick={() => copilot.open("Explain NRR drivers for the last 90 days.")}
          />
          <KpiCard
            label="Blended GM"
            value={formatPct(gm)}
            delta={deltaOf(gmSeries)}
            format="pct"
            series={gmSeries}
            invertDelta
            hint="Target 65% · Sequencing drag"
            onClick={() => copilot.open("Why is blended GM under 65%?")}
          />
          <KpiCard
            label="Rule of 40"
            value={r40.toFixed(0)}
            delta={deltaOf(ruleOf40Series)}
            format="number"
            series={ruleOf40Series}
            onClick={() => copilot.open("Break down Rule of 40 by growth vs margin.")}
          />
          <KpiCard
            label="Magic Number"
            value={formatMultiple(magic)}
            delta={deltaOf(magicSeries)}
            format="multiple"
            series={magicSeries}
            onClick={() => copilot.open("Is our magic number sustainable at current CAC payback?")}
          />
          <KpiCard
            label="CAC Payback"
            value={formatMonths(cac)}
            delta={deltaOf(cacPaybackSeries)}
            format="months"
            series={cacPaybackSeries}
            invertDelta
            hint="Drifted past 12 mo"
            onClick={() => copilot.open("Why did CAC payback cross 12 months?")}
          />
          <KpiCard
            label="Monthly Burn"
            value={formatUsd(burn)}
            delta={deltaOf(burnSeries)}
            format="usd"
            series={burnSeries}
            invertDelta
            onClick={() => copilot.open("Walk me through March burn drivers.")}
          />
          <KpiCard
            label="LLM COGS"
            value={formatUsd(cogs)}
            delta={deltaOf(llmCogsSeries)}
            format="usd"
            series={llmCogsSeries}
            invertDelta
            hint="42% over plan"
            onClick={() => copilot.open("Why did LLM COGS miss plan?")}
          />
          <KpiCard
            label="Headcount"
            value={formatNumber(hc)}
            delta={deltaOf(headcountSeries)}
            format="number"
            series={headcountSeries}
            onClick={() => copilot.open("Where are we over-hiring vs plan?")}
          />
          <Card className="p-5 border-primary/40 bg-gradient-to-br from-accent/40 to-card">
            <div className="text-[10px] uppercase tracking-widest text-accent-foreground font-semibold mb-2">
              Runway
            </div>
            <div className="text-3xl font-bold tabular-nums">28.4 mo</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Post Series B. Net of Q2 hiring plan.
            </div>
          </Card>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ARR trajectory */}
          <Card className="lg:col-span-2 p-5 bg-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  ARR Trajectory · 12 mo
                </div>
                <div className="text-2xl font-bold tabular-nums mt-1">
                  {formatUsd(arr)}
                </div>
              </div>
              <Badge className="bg-success/15 text-success border-success/30 font-mono">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{deltaOf(arrSeries).toFixed(1)}% QoQ
              </Badge>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={arrSeries}>
                  <defs>
                    <linearGradient id="arrFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tickFormatter={(v: string) => v.slice(2, 7)}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(0)}M`}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={fmtUsdTip as any}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#arrFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Vendor mix */}
          <Card className="p-5 bg-card">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Vendor Mix · Inference COGS
            </div>
            <div className="text-xl font-bold tabular-nums mt-1 mb-3">
              {formatUsd(vendorMixCurrent.reduce((s, v) => s + v.cogs, 0))}
            </div>
            <div className="h-40">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={vendorMixCurrent}
                    dataKey="share"
                    nameKey="vendor"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {vendorMixCurrent.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={fmtPctTip as any}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-1.5">
              {vendorMixCurrent.map((v, i) => (
                <div key={v.vendor} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: CHART_COLORS[i] }}
                    />
                    <span className="text-muted-foreground">{v.vendor}</span>
                  </div>
                  <span className="font-mono tabular-nums">{v.share}%</span>
                </div>
              ))}
            </div>
            <Badge variant="outline" className="mt-3 border-warning/40 text-warning text-[10px]">
              Concentration risk · Ask Why
            </Badge>
          </Card>

          {/* ARR by product */}
          <Card className="lg:col-span-2 p-5 bg-card">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-4">
              ARR by Product · Margin Overlay
            </div>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={arrByProduct} layout="vertical" margin={{ left: 20 }}>
                  <XAxis
                    type="number"
                    tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(0)}M`}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="product"
                    tick={{ fill: "var(--foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={140}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={fmtUsdOrPct as any}
                  />
                  <Bar dataKey="arr" radius={[0, 6, 6, 0]}>
                    {arrByProduct.map((p, i) => (
                      <Cell
                        key={i}
                        fill={p.gm < 60 ? "var(--chart-4)" : CHART_COLORS[i]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Critical signals */}
          <Card className="p-5 bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Signal Desk · Critical
              </div>
              <Link
                to="/signal-desk"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                All signals <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {criticalAlerts.slice(0, 3).map((a) => (
                <button
                  key={a.id}
                  onClick={() => copilot.open(`Explain this alert: ${a.title}. Driver notes: ${a.message}`)}
                  className="w-full text-left p-3 rounded-lg border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground">{a.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {a.message}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
