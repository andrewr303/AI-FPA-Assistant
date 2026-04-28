// Client-side AI copilot bindings. Calls the same-origin /api proxy by default.
// The proxy keeps AI_GATEWAY_API_KEY server-side and sends requests to Vercel AI
// Gateway. A Vite override is still honored for nonstandard deployments.

import {
  alerts,
  varianceRecords,
  kpis,
  vendorMixCurrent,
  arrByProduct,
  computeCostPerAction,
} from "@/lib/mock/data";

export type Msg = { role: "user" | "assistant" | "system"; content: string };

const SUPABASE_COPILOT_API = import.meta.env.VITE_SUPABASE_URL
  ? `${String(import.meta.env.VITE_SUPABASE_URL).replace(/\/$/, "")}/functions/v1/copilot`
  : "";

const COPILOT_API = (
  (import.meta.env.VITE_COPILOT_API_URL as string | undefined) || SUPABASE_COPILOT_API || "/api"
).replace(/\/$/, "");

const PRETTY_API_ROUTE_PATTERN = /^\/[a-z-]+$/;

function shouldTryPhpFallback(path: string, status: number, contentType: string): boolean {
  return (
    COPILOT_API === "/api" &&
    PRETTY_API_ROUTE_PATTERN.test(path) &&
    (status === 404 ||
      status === 405 ||
      contentType.includes("text/html") ||
      contentType.includes("text/plain"))
  );
}

export const COPILOT_MISSING_KEY = "missing_ai_gateway_api_key";

export type CopilotError = Error & { code?: string; status?: number };

export function isMissingKeyError(e: unknown): boolean {
  return (e as { code?: string } | null)?.code === COPILOT_MISSING_KEY;
}

async function call<T>(path: string, body: unknown): Promise<T | null> {
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
  let res = await fetch(`${COPILOT_API}${path}`, init);
  const contentType = res.headers.get("content-type") ?? "";
  if (shouldTryPhpFallback(path, res.status, contentType)) {
    res = await fetch(`${COPILOT_API}/copilot.php?action=${encodeURIComponent(path.slice(1))}`, init);
  }
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    let code: string | undefined;
    try {
      code = (JSON.parse(raw) as { code?: string }).code;
    } catch {
      // body wasn't JSON; leave code undefined
    }
    const err: CopilotError = new Error(
      `copilot ${res.status}${code ? ` [${code}]` : ""}${raw ? `: ${raw}` : ""}`,
    );
    err.code = code;
    err.status = res.status;
    if (code === COPILOT_MISSING_KEY && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("copilot:missing-key"));
    }
    throw err;
  }
  return (await res.json()) as T;
}

function fallbackNote(e: unknown, defaultMessage: string): string {
  return isMissingKeyError(e)
    ? "AI Gateway key is not configured on the server. Open /api/diagnostic to see which Hostinger config source needs the key (see DEPLOY.md → Troubleshooting)."
    : defaultMessage;
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

const FALLBACK_NOTE =
  "AI Gateway is not available yet. Configure the server-side AI_GATEWAY_API_KEY and retry.\n\n*-- drawn from runtime AI configuration*";

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
    return { reply: fallbackNote(e, FALLBACK_NOTE), error: true };
  }
  return { reply: FALLBACK_NOTE, error: true };
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
    headline: `Variance brief for ${args.data.period} is offline (AI Gateway unavailable).`,
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
    risks: ["Configure server-side AI_GATEWAY_API_KEY to enable live AI commentary."],
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
  // Fallback: pick highest Rule of 40.
  const best = [...plays].sort((a, b) => b.rule_of_40_score - a.rule_of_40_score)[0];
  return {
    recommended_id: best?.id ?? "",
    rationale:
      "Fallback mode: chose highest Rule-of-40. Live AI rationale requires server-side AI_GATEWAY_API_KEY.",
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
    rationale:
      "Fallback mode: rule-of-thumb suggestion. Live AI requires server-side AI_GATEWAY_API_KEY.",
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
      "Forecast accuracy on LLM COGS deteriorated sharply after February 2026 -- driven by the Opus 4.7 tokenizer change which added about 35% to coding-agent token counts that the model never saw during training. New ARR forecasts have improved as Sequencing pipeline matured. *-- fallback commentary*",
    error: true,
  };
}
