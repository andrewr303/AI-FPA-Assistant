// Client-side AI copilot bindings. Call a server endpoint defined by
// VITE_COPILOT_API_URL (e.g. https://nooks.andrewvrodriguez.com/api).
// Each function falls back to a sensible "demo mode" response when no
// endpoint is configured, so the SPA still renders without an API.

import {
  alerts,
  varianceRecords,
  kpis,
  vendorMixCurrent,
  arrByProduct,
  computeCostPerAction,
} from "@/lib/mock/data";

export type Msg = { role: "user" | "assistant" | "system"; content: string };

const COPILOT_API = (import.meta.env.VITE_COPILOT_API_URL as string | undefined)?.replace(
  /\/$/,
  "",
);

async function call<T>(path: string, body: unknown): Promise<T | null> {
  if (!COPILOT_API) return null;
  const res = await fetch(`${COPILOT_API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`copilot ${res.status}`);
  return (await res.json()) as T;
}

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

const DEMO_NOTE =
  "Demo mode — set VITE_COPILOT_API_URL to a Hostinger /api endpoint to enable live AI.\n\n*— drawn from build config*";

// ============= /ask-finance =============

export async function askFinance(args: { data: { messages: Msg[] } }): Promise<{
  reply: string;
  error: boolean;
}> {
  try {
    const r = await call<{ reply: string; error: boolean }>("/ask-finance", {
      messages: args.data.messages,
      context: buildContext(),
    });
    if (r) return r;
  } catch (e) {
    console.error("[ask-finance]", e);
    return { reply: "Copilot error — please retry.", error: true };
  }
  return { reply: DEMO_NOTE, error: true };
}

// ============= /variance-brief =============

export type Brief = {
  headline: string;
  drivers: { name: string; impact_usd: number; direction: "favorable" | "unfavorable" }[];
  risks: string[];
  recommendations: string[];
  error: boolean;
};

export async function varianceBrief(args: { data: { period: string } }): Promise<Brief> {
  const records = varianceRecords.filter((r) => r.period === args.data.period);
  try {
    const r = await call<Brief>("/variance-brief", { period: args.data.period, records });
    if (r) return r;
  } catch (e) {
    console.error("[variance-brief]", e);
  }
  return {
    headline: `Variance brief for ${args.data.period} is offline (demo mode).`,
    drivers: records.slice(0, 3).map((r) => {
      const delta = r.actual - r.plan;
      const favorable =
        r.lineItem === "churn" || r.lineItem === "llm_cogs" ? delta <= 0 : delta >= 0;
      return {
        name: `${r.lineItem} (${r.segment ?? "blended"})`,
        impact_usd: delta,
        direction: favorable ? ("favorable" as const) : ("unfavorable" as const),
      };
    }),
    risks: ["Set VITE_COPILOT_API_URL to enable live AI commentary."],
    recommendations: [],
    error: true,
  };
}

// ============= /pricing-recommendation =============

export type PricingPlay = {
  id: string;
  name: string;
  pricing_model: "per_seat" | "usage" | "hybrid";
  cap_actions_per_seat?: number;
  overage_rate_usd?: number;
  list_price_per_seat_usd: number;
  projected_arr_y1_usd: number;
  projected_gm_pct: number;
  projected_nrr_pct: number;
  rule_of_40_score: number;
};

export type PricingRec = {
  recommended_id: string;
  rationale: string;
  risks: string[];
  error: boolean;
};

export async function pricingRecommendation(plays: PricingPlay[]): Promise<PricingRec> {
  try {
    const r = await call<PricingRec>("/pricing-recommendation", { plays });
    if (r) return r;
  } catch (e) {
    console.error("[pricing-recommendation]", e);
  }
  // Demo: pick highest Rule of 40
  const best = [...plays].sort((a, b) => b.rule_of_40_score - a.rule_of_40_score)[0];
  return {
    recommended_id: best?.id ?? "",
    rationale:
      "Demo mode: chose highest Rule-of-40. Live AI rationale requires VITE_COPILOT_API_URL.",
    risks: [],
    error: true,
  };
}

// ============= /vendor-rollout =============

export type VendorRolloutModel = {
  vendor: string;
  model_name: string;
  cost_per_action_usd: number;
  quality_score: number;
};

export type VendorRollout = {
  scale: string[];
  pilot: string[];
  deprecate: string[];
  rationale: string;
  concentration_warning: string | null;
  error: boolean;
};

export async function vendorRollout(
  models: VendorRolloutModel[],
  mix: { vendor: string; share: number }[],
): Promise<VendorRollout> {
  try {
    const r = await call<VendorRollout>("/vendor-rollout", { models, mix });
    if (r) return r;
  } catch (e) {
    console.error("[vendor-rollout]", e);
  }
  return {
    scale: ["claude-sonnet-4.6"],
    pilot: ["gemini-3-flash"],
    deprecate: [],
    rationale: "Demo mode: rule-of-thumb suggestion. Live AI requires VITE_COPILOT_API_URL.",
    concentration_warning: mix.find((m) => m.share > 60)
      ? `${mix.find((m) => m.share > 60)?.vendor} concentration above 60% threshold.`
      : null,
    error: true,
  };
}

// ============= /forecast-explainer =============

export async function forecastExplainer(history: unknown[]): Promise<{
  reply: string;
  error: boolean;
}> {
  try {
    const r = await call<{ reply: string; error: boolean }>("/forecast-explainer", { history });
    if (r) return r;
  } catch (e) {
    console.error("[forecast-explainer]", e);
  }
  return {
    reply:
      "Forecast accuracy on LLM COGS deteriorated sharply after February 2026 — driven by the Opus 4.7 tokenizer change which added ~35% to coding-agent token counts that the model never saw during training. New-ARR forecasts have actually improved as Sequencing pipeline matured. *— demo mode commentary*",
    error: true,
  };
}
