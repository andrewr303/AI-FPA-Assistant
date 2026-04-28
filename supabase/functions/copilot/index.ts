type Role = "system" | "user" | "assistant";
type GatewayMessage = { role: Role; content: string };
type JsonObject = Record<string, unknown>;

const AI_GATEWAY_CHAT_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3.1-pro-preview";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const NOOKS_SYSTEM = `You are the in-house FP&A copilot for Nooks, an AI-native sales-tech company.

Current snapshot, April 2026:
- ARR: $210.4M, about 6x since Series B.
- Blended gross margin: 61%, below the 65% target because Sequencing runs near 54%.
- NRR: about 118%; Magic Number: about 1.15.
- CAC Payback: 13.4 months.
- Rule of 40: about 48.
- LLM COGS is 42% over plan in March, driven by the Opus 4.7 tokenizer change.

Operating rules:
- Ground claims in supplied workspace data. Do not invent metrics, customers, or dates.
- Cite the driver when you cite a number.
- Separate facts from judgment and label uncertainty.
- Give finance operators concise, board-ready language.
- Avoid legal, tax, investment, or fairness-opinion framing.
- End narrative answers with an italic source note like *-- drawn from workspace signals*.
- Use Nooks language sparingly: "Ask Why", "Do More With Less", or "More signal. Less spreadsheet."`;

const GROUND_TRUTH_RULES = `Ground-truth rules:
- Treat workspace finance/KPI JSON as private scenario data for this app, not public Nooks disclosure.
- Nooks is an AI-native outbound workspace spanning AI Dialer, AI Sequencing, Signals & Intelligence, AI Coaching, and Contact Data Enrichment.
- Public pricing is quote-based; do not invent public price points, valuation, patents, APIs, customers, or traction beyond supplied context.
- If public ground truth is missing, say which supplied workspace source you are using instead of blending in guesses.`;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function asObject(input: unknown): JsonObject {
  return input && typeof input === "object" && !Array.isArray(input) ? (input as JsonObject) : {};
}

function toMessages(input: unknown): GatewayMessage[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((item): GatewayMessage[] => {
    const message = asObject(item);
    const role = message.role;
    const content = message.content;
    if (
      (role === "user" || role === "assistant" || role === "system") &&
      typeof content === "string"
    ) {
      return [{ role, content: content.slice(0, 8000) }];
    }
    return [];
  });
}

function stripJsonFence(value: string): string {
  return value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function parseJsonObject(raw: string): JsonObject {
  const parsed = JSON.parse(stripJsonFence(raw)) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Gateway returned non-object JSON.");
  }
  return parsed as JsonObject;
}

async function callGateway(
  apiKey: string,
  messages: GatewayMessage[],
  options: { maxTokens: number; temperature: number; jsonMode?: boolean },
): Promise<string> {
  if (!apiKey) {
    throw new Error("AI_GATEWAY_API_KEY is not configured on the server.");
  }

  const response = await fetch(AI_GATEWAY_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: Deno.env.get("AI_GATEWAY_MODEL") ?? DEFAULT_MODEL,
      messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  const text = await response.text();
  let payload: { choices?: { message?: { content?: string | null } }[]; error?: { message?: string } } = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { error: { message: text.slice(0, 500) } };
  }

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `AI Gateway returned ${response.status}.`);
  }

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("AI Gateway returned an empty response.");
  }
  return content;
}

function jsonTaskPrompt(task: string, data: unknown, schema: string, constraints: string): string {
  return [
    task,
    "",
    "Input JSON:",
    JSON.stringify(data, null, 2),
    "",
    `Return only valid JSON with this shape: ${schema}`,
    constraints,
  ].join("\n");
}

function actionFromRequest(req: Request): string {
  const url = new URL(req.url);
  const queryAction = url.searchParams.get("action");
  if (queryAction) return queryAction;
  const parts = url.pathname.split("/").filter(Boolean);
  const last = parts.at(-1) ?? "";
  return last === "copilot" ? "" : last;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const action = actionFromRequest(req);
  const apiKey = Deno.env.get("AI_GATEWAY_API_KEY") ?? "";
  const body = asObject(await req.json().catch(() => ({})));

  try {
    switch (action) {
      case "ask-finance": {
        const messages = toMessages(body.messages);
        const context = body.context;
        const payload: GatewayMessage[] = [
          { role: "system", content: NOOKS_SYSTEM },
          { role: "system", content: GROUND_TRUTH_RULES },
        ];
        if (context) {
          payload.push({
            role: "system",
            content: `Live workspace context JSON:\n${JSON.stringify(context)}`,
          });
        }
        payload.push(...messages);
        const reply = await callGateway(apiKey, payload, { maxTokens: 700, temperature: 0.35 });
        return json({ reply, error: false });
      }

      case "variance-brief": {
        const prompt = jsonTaskPrompt(
          `Write a terse board variance brief for ${String(body.period ?? "the selected period")}.`,
          { period: body.period, records: body.records ?? [] },
          '{ "headline": string, "drivers": {"name": string, "impact_usd": number, "direction": "favorable" | "unfavorable"}[], "risks": string[], "recommendations": string[] }',
          "Headline must include one specific dollar variance. Drivers must reflect favorable/unfavorable finance logic. Risks and recommendations should be concrete and non-alarmist.",
        );
        const raw = await callGateway(
          apiKey,
          [
            { role: "system", content: NOOKS_SYSTEM },
            { role: "system", content: GROUND_TRUTH_RULES },
            { role: "user", content: prompt },
          ],
          { maxTokens: 800, temperature: 0.25, jsonMode: true },
        );
        return json({ ...parseJsonObject(raw), error: false });
      }

      case "pricing-recommendation": {
        const prompt = jsonTaskPrompt(
          "Choose the strongest AI Sequencing pricing play for Nooks.",
          { plays: body.plays ?? [] },
          '{ "recommended_id": string, "rationale": string, "risks": string[] }',
          "Prefer the option that best balances ARR, NRR, gross margin, and Rule of 40. Rationale must cite at least two supplied numbers. Include 2-3 risks.",
        );
        const raw = await callGateway(
          apiKey,
          [
            { role: "system", content: NOOKS_SYSTEM },
            { role: "system", content: GROUND_TRUTH_RULES },
            { role: "user", content: prompt },
          ],
          { maxTokens: 650, temperature: 0.25, jsonMode: true },
        );
        return json({ ...parseJsonObject(raw), error: false });
      }

      case "vendor-rollout": {
        const prompt = jsonTaskPrompt(
          "Recommend which LLM models Nooks should scale, pilot, or deprecate.",
          { models: body.models ?? [], mix: body.mix ?? [] },
          '{ "scale": string[], "pilot": string[], "deprecate": string[], "rationale": string, "concentration_warning": string | null }',
          "Each list must contain model_name strings from the input. Rationale must cite cost per action, quality, or concentration risk. Flag any vendor above 60% share.",
        );
        const raw = await callGateway(
          apiKey,
          [
            { role: "system", content: NOOKS_SYSTEM },
            { role: "system", content: GROUND_TRUTH_RULES },
            { role: "user", content: prompt },
          ],
          { maxTokens: 750, temperature: 0.25, jsonMode: true },
        );
        return json({ ...parseJsonObject(raw), error: false });
      }

      case "forecast-explainer": {
        const prompt = [
          "Explain why LLM cost forecast accuracy is degrading.",
          "Use the supplied forecast-vs-actual history and reference the February 2026 Opus 4.7 tokenizer change only as a driver, not as the whole story if the data says otherwise.",
          "Return one paragraph of 3-4 sentences for a board packet. No JSON.",
          "",
          "History JSON:",
          JSON.stringify(body.history ?? [], null, 2),
        ].join("\n");
        const reply = await callGateway(
          apiKey,
          [
            { role: "system", content: NOOKS_SYSTEM },
            { role: "system", content: GROUND_TRUTH_RULES },
            { role: "user", content: prompt },
          ],
          { maxTokens: 450, temperature: 0.35 },
        );
        return json({ reply, error: false });
      }

      default:
        return json({ error: `unknown copilot action: ${action || "(missing)"}` }, 404);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "copilot upstream failure";
    console.error("[copilot]", message);
    return json({ error: message }, message.includes("AI_GATEWAY_API_KEY") ? 500 : 502);
  }
});
