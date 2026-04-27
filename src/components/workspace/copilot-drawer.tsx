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

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What's our blended cost per action this month?",
  "Summarize Q1 variance in one paragraph.",
  "If we raise Sequencing price 10%, what happens?",
  "Why did LLM COGS miss plan?",
];

export function CopilotDrawer({
  open,
  onOpenChange,
  prefill,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  prefill?: string;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ask = askFinance;

  useEffect(() => {
    if (prefill && open) setInput(prefill);
  }, [prefill, open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await ask({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Copilot error — please retry." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[520px] flex flex-col bg-card border-l border-border p-0"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div>
              <SheetTitle className="text-base">Ask Finance</SheetTitle>
              <SheetDescription className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Agent Workspace · Live
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The agent is still listening. Insights drop when the call ends. Try one of these:
              </p>
              <div className="space-y-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full text-left text-xs rounded-md border border-border bg-background/50 p-2.5 hover:border-primary/40 hover:bg-accent/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex gap-2.5 text-sm", m.role === "user" ? "flex-row-reverse" : "")}
            >
              <div
                className={cn(
                  "h-7 w-7 rounded-md shrink-0 flex items-center justify-center",
                  m.role === "user"
                    ? "bg-accent text-accent-foreground"
                    : "bg-gradient-to-br from-primary to-primary/40 text-primary-foreground",
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
                  "rounded-lg px-3 py-2 max-w-[85%] whitespace-pre-wrap leading-relaxed",
                  m.role === "user"
                    ? "bg-primary/15 text-foreground"
                    : "bg-background border border-border",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex gap-2.5 items-center text-xs text-muted-foreground">
              <div className="h-7 w-7 rounded-md bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-foreground" />
              </div>
              Reasoning across signals…
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 border-t border-border px-4 py-3 bg-background/60"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the agent…"
            disabled={busy}
            className="flex-1 bg-background border-border"
          />
          <Button type="submit" disabled={busy || !input.trim()} size="icon" className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
