import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "@/components/workspace/top-bar";
import { Card } from "@/components/ui/card";
import { OperatingPrinciple } from "@/components/brand/operating-principle";
import { useCopilot } from "@/components/workspace/copilot-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askFinance, type Msg } from "@/lib/ai/copilot.functions";
import { alerts, kpis, varianceRecords } from "@/lib/mock/data";
import { Bot, Loader2, Send, Sparkles, User, RefreshCw, Eraser, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_workspace/copilot")({
  component: Page,
});

const STARTERS = [
  "Summarize the biggest budget risk this quarter in 5 bullets.",
  "Which KPI is most likely to miss next month and why?",
  "Write a board-ready narrative for ARR, GM, and burn.",
  "Give me 3 levers to improve gross margin with low execution risk.",
];

const KPI_KEYS = ["arr", "gm", "nrr", "burn", "rule_of_40", "llm_cogs"] as const;

type UiMsg = Msg & { ts: number };

function Page() {
  const copilot = useCopilot();
  const [input, setInput] = useState(STARTERS[0]);
  const [messages, setMessages] = useState<UiMsg[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const kpiSnapshot = useMemo(() => {
    return KPI_KEYS.map((key) => {
      const series = kpis[key];
      const current = series.at(-1)?.value ?? 0;
      const prev = series.at(-2)?.value ?? current;
      const delta = current - prev;
      return { key, current, delta };
    });
  }, []);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: UiMsg[] = [...messages, { role: "user", content: q, ts: Date.now() }];
    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const res = await askFinance({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: res.reply, ts: Date.now() }]);
      setLastUpdated(new Date());
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "I couldn't reach the copilot service. Please retry in a moment.",
          ts: Date.now(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopBar
        title="Ask Finance"
        subtitle="Your FP&A agent, full-screen. Interrogate metrics, risks, and plans in one workspace."
        onAskFinance={() => copilot.open()}
      />
      <div className="flex-1 px-6 py-6 space-y-6 max-w-[1600px] w-full">
        <OperatingPrinciple principle="earn-customer-love" />

        <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_340px] gap-4 min-h-[72vh]">
          <Card className="p-4 bg-card/80 border-border space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Starter prompts
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Run common CFO workflows instantly.
              </p>
            </div>
            <div className="space-y-2">
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  onClick={() => {
                    setInput(starter);
                    send(starter);
                  }}
                  className="text-left w-full text-xs rounded-md border border-border bg-background/40 p-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  {starter}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setMessages([]);
                setInput(STARTERS[0]);
              }}
            >
              <Eraser className="h-3.5 w-3.5 mr-1.5" /> New thread
            </Button>
          </Card>

          <Card className="bg-card/70 border-border flex flex-col min-h-[72vh] overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-linear-to-br from-primary to-primary/40 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Ask Finance</div>
                  <div className="text-[11px] text-muted-foreground">
                    Live reasoning over your FP&A context
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
                FY26
              </Badge>
            </div>

            <div ref={feedRef} className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 && (
                <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 rounded-xl bg-linear-to-br from-primary to-primary/40 flex items-center justify-center mb-3">
                    <Sparkles className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <p className="text-lg font-semibold">What should finance do next?</p>
                  <p className="text-sm text-muted-foreground max-w-lg mt-1">
                    Ask for variance narratives, pricing moves, gross margin plays, or risk scans.
                    Responses are grounded in the demo data model.
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={`${m.ts}-${i}`}
                  className={cn("flex gap-2.5 text-sm", m.role === "user" && "flex-row-reverse")}
                >
                  <div
                    className={cn(
                      "h-7 w-7 rounded-md shrink-0 flex items-center justify-center",
                      m.role === "user"
                        ? "bg-accent text-accent-foreground"
                        : "bg-linear-to-br from-primary to-primary/40 text-primary-foreground",
                    )}
                  >
                    {m.role === "user" ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <Bot className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 max-w-[88%] whitespace-pre-wrap leading-relaxed",
                      m.role === "user" ? "bg-primary/15" : "bg-background border border-border",
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <div className="h-7 w-7 rounded-md bg-linear-to-br from-primary to-primary/40 flex items-center justify-center">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-foreground" />
                  </div>
                  Generating finance guidance...
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="border-t border-border p-4 space-y-2"
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about margin, forecast confidence, vendor mix, headcount tradeoffs..."
                className="min-h-[86px] resize-none"
                disabled={busy}
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">Shift+Enter for newline.</p>
                <Button type="submit" disabled={busy || !input.trim()}>
                  <Send className="h-4 w-4 mr-1.5" /> Ask Finance
                </Button>
              </div>
            </form>
          </Card>

          <div className="space-y-4">
            <Card className="p-4 bg-card/80 border-border">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Live snapshot
                </p>
                <button
                  onClick={() => send("Refresh and summarize top KPI moves today.")}
                  className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {kpiSnapshot.map((k) => (
                  <div
                    key={k.key}
                    className="rounded-md border border-border p-2.5 bg-background/35"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {k.key.replaceAll("_", " ")}
                    </p>
                    <p className="text-sm font-semibold mt-1">{k.current.toLocaleString()}</p>
                    <p
                      className={cn(
                        "text-[11px]",
                        k.delta >= 0 ? "text-emerald-400" : "text-rose-400",
                      )}
                    >
                      {k.delta >= 0 ? "+" : ""}
                      {k.delta.toLocaleString()} vs prior
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 bg-card/80 border-border space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Recent alerts
              </p>
              {alerts.slice(0, 4).map((a) => (
                <button
                  key={a.id}
                  className="w-full text-left rounded-md border border-border bg-background/35 p-2.5 hover:border-primary/40 transition-colors"
                  onClick={() =>
                    send(`Analyze this alert and propose a playbook: ${a.title}. ${a.message}`)
                  }
                >
                  <div className="text-xs font-medium line-clamp-1">{a.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {a.message}
                  </div>
                </button>
              ))}
            </Card>

            <Card className="p-4 bg-card/80 border-border">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Variance shortcuts
              </p>
              <div className="mt-2 space-y-1.5">
                {varianceRecords.slice(0, 3).map((v) => (
                  <button
                    key={`${v.period}-${v.lineItem}-${v.segment}`}
                    onClick={() =>
                      send(
                        `Explain ${v.period} variance for ${v.lineItem} (${v.segment ?? "all segments"}). Plan ${v.plan}, actual ${v.actual}.`,
                      )
                    }
                    className="w-full text-left text-xs rounded-md px-2.5 py-2 border border-border hover:border-primary/40 inline-flex items-center justify-between"
                  >
                    <span className="truncate">
                      {v.period} · {v.lineItem}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                {lastUpdated
                  ? `Last agent response: ${lastUpdated.toLocaleTimeString()}`
                  : "No responses yet."}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
