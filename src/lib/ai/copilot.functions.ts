import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  alerts,
  varianceRecords,
  kpis,
  vendorMixCurrent,
  arrByProduct,
  computeCostPerAction,
} from "@/lib/mock/data";

const CopilotInput = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    }),
  ),
});

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

export const askFinance = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CopilotInput.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      return {
        reply:
          "AI Gateway key not configured. Set `AI_GATEWAY_API_KEY` to enable the copilot.",
        error: true,
      };
    }

    const ctx = buildContext();

    try {
      const res = await fetch(
        "https://ai-gateway.vercel.sh/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "anthropic/claude-sonnet-4.5",
            messages: [
              { role: "system", content: SYSTEM },
              {
                role: "system",
                content: `Here is the live workspace context (JSON):\n${JSON.stringify(ctx, null, 2)}`,
              },
              ...data.messages,
            ],
            max_tokens: 600,
            temperature: 0.4,
          }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("[askFinance] gateway error", res.status, text);
        return {
          reply: `Gateway error (${res.status}). Check AI_GATEWAY_API_KEY and model access.`,
          error: true,
        };
      }

      const json: {
        choices?: { message?: { content?: string } }[];
      } = await res.json();
      const reply =
        json.choices?.[0]?.message?.content?.trim() ||
        "The agent is still listening.";
      return { reply, error: false };
    } catch (e) {
      console.error("[askFinance] failed", e);
      return {
        reply: "Copilot error — please retry.",
        error: true,
      };
    }
  });

// ===== Variance brief (structured exec narrative) =====

const BriefInput = z.object({ period: z.string() });

export const varianceBrief = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => BriefInput.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    const records = varianceRecords.filter((r) => r.period === data.period);
    if (!apiKey) {
      return {
        headline: "AI Gateway key not configured.",
        drivers: [],
        risks: [],
        recommendations: [],
        error: true,
      };
    }

    const prompt = `You are Dan Lee writing a terse board variance brief for Nooks for ${data.period}.
Variance data:
${JSON.stringify(records, null, 2)}

Return ONLY a valid JSON object (no markdown fences) matching this TypeScript type:
{
  "headline": string,                          // one sentence punchline with a specific dollar number
  "drivers": { "name": string, "impact_usd": number, "direction": "favorable" | "unfavorable" }[],  // 3-5 items
  "risks": string[],                           // 2-4 items, each one sentence
  "recommendations": string[]                  // 2-4 items, each one sentence, action-oriented
}

Include one Nooks-flavored phrase somewhere (e.g. "Ask Why", "More signal. Less spreadsheet.").`;

    try {
      const res = await fetch(
        "https://ai-gateway.vercel.sh/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "anthropic/claude-sonnet-4.5",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 700,
            temperature: 0.3,
          }),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        console.error("[varianceBrief] gateway error", res.status, text);
        return {
          headline: `Gateway error (${res.status}).`,
          drivers: [],
          risks: [],
          recommendations: [],
          error: true,
        };
      }
      const json: { choices?: { message?: { content?: string } }[] } =
        await res.json();
      const raw = json.choices?.[0]?.message?.content?.trim() || "{}";
      // Strip possible ```json fences
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
      const parsed = JSON.parse(cleaned);
      return { ...parsed, error: false };
    } catch (e) {
      console.error("[varianceBrief] failed", e);
      return {
        headline: "Brief generation failed — retry.",
        drivers: [],
        risks: [],
        recommendations: [],
        error: true,
      };
    }
  });
