import {
  alerts,
  varianceRecords,
  kpis,
  vendorMixCurrent,
  arrByProduct,
  computeCostPerAction,
} from "@/lib/mock/data";

type Msg = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM = `You are the in-house FP&A copilot for Nooks, an AI-native sales-tech company.
You exist because their finance team is "all in Sheets" and just launched AI Sequencing in February 2026 with usage-based pricing.
Products: AI Dialer, AI Coaching, Signals & Intelligence, AI Sequencing, Nooks Numbers.
Customer segments: enterprise, mid_market, smb.
LLM vendors: OpenAI (64% mix), Anthropic (28%), Google (6%), DeepSeek (2%).

Operating principles:
- "Ask Why" — when you cite a number, cite its driver too.
- "Do More With Less" — answer in the fewest words that solve the problem.
- "Earn Customer Love" — your audience is the VP Finance, CRO Hannah Willson, and CEO Dan Lee.

Current snapshot (April 2026):
- ARR: $210.4M (6× since Series B)
- Blended GM: 61% (below 65% target — Sequencing at 54% dragging blend)
- NRR: ~118%
- Magic Number: ~1.15
- CAC Payback: 13.4 mo (just drifted past 12)
- Rule of 40: ~48
- Headcount: ~200 FTE
- LLM COGS running 42% over plan in March ($2.41M vs $1.70M) — driver: Opus 4.7 tokenizer change.

Format:
- Numbers in USD with thousands separators.
- One short paragraph. No bullets unless asked.
- End with one italic citation line: *— drawn from {source}*.
- Occasionally drop a phrase like "Ask Why" or "More signal. Less spreadsheet."
`;

function buildContext() {
  return {
    kpi_snapshot: {
      arr: kpis.arr.at(-1)?.value,
      gm: kpis.gm.at(-1)?.value,
      nrr: kpis.nrr.at(-1)?.value,
      burn: kpis.burn.at(-1)?.value,
      cac_payback: kpis.cac_payback.at(-1)?.value,
      rule_of_40: kpis.rule_of_40.at(-1)?.value,
      llm_cogs: kpis.llm_cogs.at(-1)?.value,
      headcount: kpis.headcount.at(-1)?.value,
    },
    alerts: alerts.slice(0, 4),
    variance_last_3mo: varianceRecords,
    vendor_mix: vendorMixCurrent,
    arr_by_product: arrByProduct,
    blended_cost_per_action: computeCostPerAction({
      tokensIn: 2400,
      tokensOut: 800,
      cacheHitRate: 0.35,
      vendorMix: { openai: 0.64, anthropic: 0.28, google: 0.06, deepseek: 0.02 },
      discountPct: 18,
      routingOverheadPct: 10,
    }).total,
  };
}

const COPILOT_API = import.meta.env.VITE_COPILOT_API_URL as string | undefined;

async function callCopilotApi<T>(path: string, body: unknown): Promise<T | null> {
  if (!COPILOT_API) return null;
  const res = await fetch(`${COPILOT_API.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`copilot api ${res.status}`);
  return (await res.json()) as T;
}

export async function askFinance(args: { data: { messages: Msg[] } }): Promise<{
  reply: string;
  error: boolean;
}> {
  try {
    const remote = await callCopilotApi<{ reply: string; error: boolean }>("/ask-finance", {
      messages: args.data.messages,
      system: SYSTEM,
      context: buildContext(),
    });
    if (remote) return remote;
  } catch (e) {
    console.error("[askFinance] remote failed", e);
    return { reply: "Copilot error — please retry.", error: true };
  }
  return {
    reply:
      "This is the static Hostinger build, so the live copilot is offline. Set VITE_COPILOT_API_URL to point at a hosted endpoint to enable Ask Finance.\n\n*— drawn from build config*",
    error: true,
  };
}

export async function varianceBrief(args: { data: { period: string } }): Promise<{
  headline: string;
  drivers: { name: string; impact_usd: number; direction: "favorable" | "unfavorable" }[];
  risks: string[];
  recommendations: string[];
  error: boolean;
}> {
  const records = varianceRecords.filter((r) => r.period === args.data.period);
  try {
    const remote = await callCopilotApi<{
      headline: string;
      drivers: { name: string; impact_usd: number; direction: "favorable" | "unfavorable" }[];
      risks: string[];
      recommendations: string[];
      error: boolean;
    }>("/variance-brief", { period: args.data.period, records });
    if (remote) return remote;
  } catch (e) {
    console.error("[varianceBrief] remote failed", e);
  }
  return {
    headline: "Variance brief is offline in the static build.",
    drivers: [],
    risks: ["Set VITE_COPILOT_API_URL to enable AI briefs."],
    recommendations: [],
    error: true,
  };
}
