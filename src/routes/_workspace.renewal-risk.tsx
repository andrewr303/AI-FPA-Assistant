import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/workspace/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OperatingPrinciple } from "@/components/brand/operating-principle";
import { useCopilot } from "@/components/workspace/copilot-context";
import { CircleAlert, CircleCheckBig, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_workspace/renewal-risk")({
  component: Page,
});

const accounts = [
  { name: "Northstar Bank", risk: "high", signal: "usage down 31%", renewal: "Jul 2026" },
  { name: "Triad Health", risk: "medium", signal: "champion left", renewal: "Aug 2026" },
  { name: "Apex Retail", risk: "low", signal: "expansion open", renewal: "Sep 2026" },
] as const;

function Page() {
  const copilot = useCopilot();

  return (
    <>
      <TopBar title="Renewal Risk" subtitle="Save plan by account signal and intervention window." onAskFinance={() => copilot.open()} />
      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1600px] w-full">
        <OperatingPrinciple principle="ask-why" />
        <Card className="p-5 bg-card">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Decision</div>
          <div className="text-base font-semibold mt-1">Where should exec sponsors spend their next 10 customer calls?</div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accounts.map((a) => (
            <Card key={a.name} className="p-5 bg-card">
              <div className="flex items-center justify-between"><div className="font-semibold">{a.name}</div><Badge variant="outline">{a.risk}</Badge></div>
              <div className="mt-3 text-sm text-muted-foreground">{a.signal}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Renewal {a.renewal}</div>
            </Card>
          ))}
        </div>

        <Card className="p-5 bg-linear-to-br from-accent/30 to-card border-primary/30">
          <div className="flex items-start gap-3"><ShieldAlert className="h-4 w-4 mt-0.5 text-primary" /><p className="text-sm">Create red account war-room: sponsor outreach in 72h, product patch in 14 days, value recap before renewal committee.</p></div>
        </Card>

        <Card className="p-5 bg-card">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Monday action</div>
          <div className="flex items-start gap-2 text-sm"><CircleCheckBig className="h-4 w-4 text-success mt-0.5" />Lock executive call roster for top-5 risk renewals.</div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2"><CircleAlert className="h-4 w-4 text-warning mt-0.5" />Escalate any account with usage decline &gt;25% to daily review.</div>
        </Card>
      </div>
    </>
  );
}
