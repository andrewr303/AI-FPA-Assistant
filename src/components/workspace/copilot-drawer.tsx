import { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, Send, User, Bot } from "lucide-react";
import { askFinance } from "@/lib/ai/copilot.functions";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What's our blended cost per action this month?",
  "Summarize Q1 variance in one paragraph.",
  "If we raise Sequencing price 10%, what happens?",
  "Why did LLM COGS miss plan?",
];

function buildFollowUps(question: string, answer: string): string[] {
  const base = [
    `What assumptions drove this conclusion on: ${question.slice(0, 48)}?`,
    "What is the highest-impact action in the next 30 days?",
    "What could make this recommendation fail, and how do we mitigate it?",
  ];
  if (/arr|revenue|nrr/i.test(answer)) base[1] = "Which revenue lever should we run first, and what KPI proves it worked?";
  if (/margin|cogs|cost/i.test(answer)) base[2] = "Which cost lever has the fastest payback with lowest customer risk?";
  return base;
}

export function CopilotDrawer({ open, onOpenChange, prefill }: { open: boolean; onOpenChange: (o: boolean) => void; prefill?: string; }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>(SUGGESTIONS.slice(0, 3));
  const [companyName, setCompanyName] = useState(() => localStorage.getItem("fpa:company") ?? "Your Company");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("fpa:openai-key") ?? "");
  const [customData, setCustomData] = useState(() => localStorage.getItem("fpa:custom-data") ?? "");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem("fpa:company", companyName); }, [companyName]);
  useEffect(() => { localStorage.setItem("fpa:openai-key", apiKey); }, [apiKey]);
  useEffect(() => { localStorage.setItem("fpa:custom-data", customData); }, [customData]);
  useEffect(() => { if (prefill && open) setInput(prefill); }, [prefill, open]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next); setInput(""); setBusy(true);
    try {
      const res = await askFinance({ data: { messages: next, apiKey, companyName, customData } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
      setFollowUps(buildFollowUps(q, res.reply));
    } catch {
      setMessages([...next, { role: "assistant", content: "AI Gateway is not available yet. Add an API key in settings or configure server-side AI_GATEWAY_API_KEY and retry." }]);
    } finally { setBusy(false); }
  }

  return (<Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="right" className="w-full sm:max-w-[520px] flex flex-col glass-strong border-l p-0"><SheetHeader className="px-5 pt-5 pb-3 border-b border-border/60"><div className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-linear-to-br from-primary to-primary/40 flex items-center justify-center"><Sparkles className="h-3.5 w-3.5 text-primary-foreground" /></div><div><SheetTitle className="text-base">Ask FP&amp;A Expert</SheetTitle><SheetDescription className="text-[11px] uppercase tracking-widest text-muted-foreground">Agent Workspace · Live</SheetDescription></div></div></SheetHeader>
      <div className="px-5 py-3 border-b border-border space-y-2 bg-background/50">
        <Input value={companyName} onChange={(e)=>setCompanyName(e.target.value)} placeholder="Company name" className="text-xs" />
        <Input value={apiKey} onChange={(e)=>setApiKey(e.target.value)} placeholder="Your OpenAI API key (optional)" className="text-xs" type="password" />
        <Input value={customData} onChange={(e)=>setCustomData(e.target.value)} placeholder='Optional JSON data, e.g. {"arr":1000000}' className="text-xs" />
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-4">{/* messages unchanged */}
        <div className="space-y-3"><p className="text-sm text-muted-foreground">Suggested questions {messages.length === 0 ? "to start" : "to continue"}:</p><div className="space-y-1.5">{(messages.length === 0 ? SUGGESTIONS : followUps).map((s) => (<button key={s} onClick={() => send(s)} className="block w-full text-left text-xs rounded-md border border-border bg-background/50 p-2.5 hover:border-primary/40 hover:bg-accent/40 transition-colors">{s}</button>))}</div></div>
        {messages.map((m, i) => (<div key={i} className={cn("flex gap-2.5 text-sm", m.role === "user" ? "flex-row-reverse" : "")}><div className={cn("h-7 w-7 rounded-md shrink-0 flex items-center justify-center", m.role === "user" ? "bg-accent text-accent-foreground" : "bg-linear-to-br from-primary to-primary/40 text-primary-foreground")}>{m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}</div><div className={cn("rounded-lg px-3 py-2 max-w-[85%] whitespace-pre-wrap leading-relaxed", m.role === "user" ? "bg-primary/15 text-foreground" : "bg-background border border-border")}>{m.role === "assistant" ? <div className="text-sm [&_p]:my-1 [&_li]:my-0.5 [&_ul]:my-2 [&_ol]:my-2"><Streamdown>{m.content}</Streamdown></div> : m.content}</div></div>))}
        {busy && <div className="flex gap-2.5 items-center text-xs text-muted-foreground"><div className="h-7 w-7 rounded-md bg-linear-to-br from-primary to-primary/40 flex items-center justify-center"><Loader2 className="h-3.5 w-3.5 animate-spin text-primary-foreground" /></div>Reasoning across signals…</div>}
      </div>
      <form onSubmit={(e)=>{e.preventDefault();send(input);}} className="flex gap-2 border-t border-border px-4 py-3 bg-background/60"><Input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Ask the agent…" disabled={busy} className="flex-1 bg-background border-border" /><Button type="submit" disabled={busy || !input.trim()} size="icon" className="shrink-0"><Send className="h-4 w-4" /></Button></form>
    </SheetContent></Sheet>);
}
