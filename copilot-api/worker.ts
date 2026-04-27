// Minimal Cloudflare Worker that proxies the Nooks copilot AI calls.
// Deploy this to a Worker (or any equivalent serverless platform) so the
// static SPA on Hostinger can call /ask-finance and /variance-brief without
// leaking the AI Gateway API key to the browser.
//
// Local deploy:
//   cd copilot-api
//   npx wrangler deploy
//   npx wrangler secret put AI_GATEWAY_API_KEY
//
// Then set the GitHub secret VITE_COPILOT_API_URL to https://<your-worker>.workers.dev
// and rebuild — the SPA will start using it automatically.

interface Env {
  AI_GATEWAY_API_KEY: string;
  ALLOWED_ORIGIN?: string;
}

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const MODEL = "anthropic/claude-sonnet-4.5";

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

async function callGateway(apiKey: string, body: unknown) {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`gateway ${res.status}: ${text}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

async function askFinance(req: Request, env: Env) {
  const { messages, system, context } = (await req.json()) as {
    messages: { role: "user" | "assistant" | "system"; content: string }[];
    system: string;
    context: unknown;
  };
  try {
    const reply = await callGateway(env.AI_GATEWAY_API_KEY, {
      model: MODEL,
      messages: [
        { role: "system", content: system },
        {
          role: "system",
          content: `Here is the live workspace context (JSON):\n${JSON.stringify(context, null, 2)}`,
        },
        ...messages,
      ],
      max_tokens: 600,
      temperature: 0.4,
    });
    return { reply: reply || "The agent is still listening.", error: false };
  } catch (e) {
    console.error("[ask-finance]", e);
    return { reply: "Copilot error — please retry.", error: true };
  }
}

async function varianceBrief(req: Request, env: Env) {
  const { period, records } = (await req.json()) as {
    period: string;
    records: unknown[];
  };
  const prompt = `You are Dan Lee writing a terse board variance brief for Nooks for ${period}.
Variance data:
${JSON.stringify(records, null, 2)}

Return ONLY a valid JSON object (no markdown fences) matching this TypeScript type:
{
  "headline": string,
  "drivers": { "name": string, "impact_usd": number, "direction": "favorable" | "unfavorable" }[],
  "risks": string[],
  "recommendations": string[]
}

Include one Nooks-flavored phrase somewhere (e.g. "Ask Why", "More signal. Less spreadsheet.").`;

  try {
    const raw = await callGateway(env.AI_GATEWAY_API_KEY, {
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 700,
      temperature: 0.3,
    });
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    const parsed = JSON.parse(cleaned);
    return { ...parsed, error: false };
  } catch (e) {
    console.error("[variance-brief]", e);
    return {
      headline: "Brief generation failed — retry.",
      drivers: [],
      risks: [],
      recommendations: [],
      error: true,
    };
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN || "*";
    const cors = corsHeaders(origin);
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });

    const url = new URL(req.url);
    const headers = { ...cors, "Content-Type": "application/json" };

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "method not allowed" }), {
        status: 405,
        headers,
      });
    }

    if (url.pathname === "/ask-finance") {
      return new Response(JSON.stringify(await askFinance(req, env)), { headers });
    }
    if (url.pathname === "/variance-brief") {
      return new Response(JSON.stringify(await varianceBrief(req, env)), { headers });
    }
    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers,
    });
  },
};
