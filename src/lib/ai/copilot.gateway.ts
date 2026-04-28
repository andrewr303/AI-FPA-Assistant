import { readFileSync } from "node:fs";
import path from "node:path";

export const AI_GATEWAY_MODEL = "google/gemini-3-flash";

const AI_GATEWAY_CHAT_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const GROUND_TRUTH_PATH = path.resolve(
  process.cwd(),
  "ai-knowledge/ground-truth/nooks-ground-truth.md",
);

type Role = "system" | "user" | "assistant";
type GatewayMessage = { role: Role; content: string };

type GatewayChoice = {
  message?: {
    content?: string | null;
  };
};

type GatewayResponse = {
  choices?: GatewayChoice[];
  error?: {
    message?: string;
  };
};

type JsonObject = Record<string, unknown>;

type GatewayOptions = {
  maxTokens: number;
  temperature: number;
  jsonMode?: boolean;
};

let groundTruthCache: string | null = null;

const NOOKS_SYSTEM = `You are the in-house FP&A copilot for Nooks, an AI-native outbound workspace. You help finance operators make high-stakes decisions with "More signal. Less spreadsheet."

Identity & Context:
- Nooks has collapsed prospecting, sequencing, dialing, coaching, and signal detection into one operating layer.
- Our philosophy: Human reps with AI assistants (rep-supercharging), not rep replacement.
- ARR: $210.4M, Blended Gross Margin: 61% (Target: 65%), NRR: 118%, Rule of 40: 48.
- The 65% GM target is under pressure because Sequencing runs at 54% due to usage-based economics.
- LLM COGS hit 42% over plan in March 2026 due to the Opus 4.7 tokenizer change.

Operating Rules:
- **Board-Ready Quality:** Provide authoritative, structured, and complete narratives. Never end mid-sentence.
- **Levers & Logic:** When suggesting margin levers, consider both technical moats (real-time audio ML, signal orchestration) and business moats (NRR, seat-based vs usage-based mix).
- **Grounded reasoning:** Use only supplied workspace data and Nooks ground-truth facts. Cite drivers (e.g., "driven by Sequencing's usage-based COGS").
- **Concise Force:** Be direct and impactful. Use bulleted lists for clarity.
- **Formatting:** Use Markdown. Format money in USD (e.g., $1,234,567).
- **Tone:** Senior FP&A partner. Professional, insightful, and proactive.
- **Closing:** End narrative answers with *-- drawn from Nooks workspace signals*.
- **Mantra:** Apply Nooks principles: "Ask Why", "Do More With Less", "Extreme Ownership".`;

const GROUND_TRUTH_RULES = `Ground-truth rules:
- Treat the attached Nooks report as authoritative for public company, product, GTM, and technical-positioning claims.
- Nooks products: AI Dialer, AI Sequencing, Signals & Intelligence, AI Coaching, Contact Data Enrichment.
- Treat workspace finance/KPI JSON as private scenario data for this app.
- If data and public ground truth conflict, specify which source you are using.
- Do not invent pricing, valuation, or customers beyond the ground-truth report.`;

const ACTION_SECTIONS: Record<string, string[]> = {
  "ask-finance": [
    "Executive summary",
    "Company overview and product surface",
    "Pricing and integration posture",
    "Product architecture, technical stack, and AI/ML approach",
    "Go-to-market and business model",
    "How to tailor your app and application",
  ],
  "variance-brief": [
    "Executive summary",
    "Company overview and product surface",
    "Product architecture, technical stack, and AI/ML approach",
  ],
  "pricing-recommendation": [
    "Executive summary",
    "Pricing and integration posture",
    "Go-to-market and business model",
  ],
  "vendor-rollout": [
    "Executive summary",
    "Product architecture, technical stack, and AI/ML approach",
  ],
  "forecast-explainer": [
    "Executive summary",
    "Product architecture, technical stack, and AI/ML approach",
  ],
};

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

function loadGroundTruth(): string {
  if (groundTruthCache !== null) return groundTruthCache;
  try {
    groundTruthCache = readFileSync(GROUND_TRUTH_PATH, "utf8");
  } catch {
    groundTruthCache = "";
  }
  return groundTruthCache;
}

function extractSection(doc: string, heading: string): string {
  const pattern = new RegExp(`^##+\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m");
  const match = pattern.exec(doc);
  if (!match) return "";

  const start = match.index;
  const next = doc.slice(start + match[0].length).search(/\n##\s+/);
  if (next === -1) return doc.slice(start).trim();
  return doc.slice(start, start + match[0].length + next).trim();
}

function buildGroundTruthContext(action: string): string {
  const doc = loadGroundTruth();
  if (!doc) {
    return `${GROUND_TRUTH_RULES}\n\nGround-truth report status: unavailable at ${GROUND_TRUTH_PATH}.`;
  }

  const sections = ACTION_SECTIONS[action] ?? ACTION_SECTIONS["ask-finance"];
  const excerpt = sections
    .map((heading) => extractSection(doc, heading))
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 18000);

  return [
    GROUND_TRUTH_RULES,
    "",
    `Ground-truth report: ai-knowledge/ground-truth/nooks-ground-truth.md`,
    "",
    excerpt || doc.slice(0, 18000),
  ].join("\n");
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
  options: GatewayOptions,
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
      model: AI_GATEWAY_MODEL,
      messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  const text = await response.text();
  let payload: GatewayResponse = {};
  try {
    payload = text ? (JSON.parse(text) as GatewayResponse) : {};
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

export async function handleCopilotAction(
  action: string,
  bodyInput: unknown,
  config: { apiKey: string },
): Promise<JsonObject> {
  const body = asObject(bodyInput);

  switch (action) {
    case "diagnostic": {
      const apiKeyPresent = config.apiKey.trim() !== "";
      const sources = {
        getenv: false,
        _ENV: false,
        _SERVER: false,
        redirect_SERVER: false,
        apache_getenv: false,
        env_file: false,
        "vite-env": apiKeyPresent,
      };
      const found = Object.entries(sources)
        .filter(([, present]) => present)
        .map(([name]) => name);

      let groundTruthReadable = false;
      let groundTruthPath: string | null = null;
      try {
        readFileSync(GROUND_TRUTH_PATH, "utf8");
        groundTruthReadable = true;
        groundTruthPath = GROUND_TRUTH_PATH;
      } catch {
        groundTruthReadable = false;
      }

      const reach: { ok: boolean; http_code: number; error: string | null } = {
        ok: false,
        http_code: 0,
        error: null,
      };
      try {
        const probe = await fetch("https://ai-gateway.vercel.sh/", {
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
        });
        reach.http_code = probe.status;
        reach.ok = probe.status > 0;
      } catch (probeErr) {
        reach.error = probeErr instanceof Error ? probeErr.message : String(probeErr);
      }

      return {
        ok: apiKeyPresent && groundTruthReadable && reach.ok,
        api_key_present: apiKeyPresent,
        api_key_sources: found,
        api_key_source_map: sources,
        php_version: null,
        php_sapi: "vite-dev",
        ground_truth: { readable: groundTruthReadable, path: groundTruthPath },
        gateway_reachable: reach,
        configured_model: AI_GATEWAY_MODEL,
        allowed_origin: "*",
      };
    }

    case "ask-finance": {
      const messages = toMessages(body.messages);
      const context = body.context;
      const payload: GatewayMessage[] = [
        { role: "system", content: NOOKS_SYSTEM },
        { role: "system", content: buildGroundTruthContext(action) },
      ];
      if (context) {
        payload.push({
          role: "system",
          content: `Live workspace context JSON:\n${JSON.stringify(context)}`,
        });
      }
      payload.push(...messages);
      const reply = await callGateway(config.apiKey, payload, {
        maxTokens: 1200,
        temperature: 0.35,
      });
      return { reply, error: false };
    }

    case "variance-brief": {
      const prompt = jsonTaskPrompt(
        `Write a terse board variance brief for ${String(body.period ?? "the selected period")}.`,
        { period: body.period, records: body.records ?? [] },
        '{ "headline": string, "drivers": {"name": string, "impact_usd": number, "direction": "favorable" | "unfavorable"}[], "risks": string[], "recommendations": string[] }',
        "Headline must include one specific dollar variance. Drivers must reflect favorable/unfavorable finance logic. Risks and recommendations should be concrete and non-alarmist.",
      );
      const raw = await callGateway(
        config.apiKey,
        [
          { role: "system", content: NOOKS_SYSTEM },
          { role: "system", content: buildGroundTruthContext(action) },
          { role: "user", content: prompt },
        ],
        { maxTokens: 800, temperature: 0.25, jsonMode: true },
      );
      return { ...parseJsonObject(raw), error: false };
    }

    case "pricing-recommendation": {
      const prompt = jsonTaskPrompt(
        "Choose the strongest AI Sequencing pricing play for Nooks.",
        { plays: body.plays ?? [] },
        '{ "recommended_id": string, "rationale": string, "risks": string[] }',
        "Prefer the option that best balances ARR, NRR, gross margin, and Rule of 40. Rationale must cite at least two supplied numbers. Include 2-3 risks.",
      );
      const raw = await callGateway(
        config.apiKey,
        [
          { role: "system", content: NOOKS_SYSTEM },
          { role: "system", content: buildGroundTruthContext(action) },
          { role: "user", content: prompt },
        ],
        { maxTokens: 650, temperature: 0.25, jsonMode: true },
      );
      return { ...parseJsonObject(raw), error: false };
    }

    case "vendor-rollout": {
      const prompt = jsonTaskPrompt(
        "Recommend which LLM models Nooks should scale, pilot, or deprecate.",
        { models: body.models ?? [], mix: body.mix ?? [] },
        '{ "scale": string[], "pilot": string[], "deprecate": string[], "rationale": string, "concentration_warning": string | null }',
        "Each list must contain model_name strings from the input. Rationale must cite cost per action, quality, or concentration risk. Flag any vendor above 60% share.",
      );
      const raw = await callGateway(
        config.apiKey,
        [
          { role: "system", content: NOOKS_SYSTEM },
          { role: "system", content: buildGroundTruthContext(action) },
          { role: "user", content: prompt },
        ],
        { maxTokens: 750, temperature: 0.25, jsonMode: true },
      );
      return { ...parseJsonObject(raw), error: false };
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
        config.apiKey,
        [
          { role: "system", content: NOOKS_SYSTEM },
          { role: "system", content: buildGroundTruthContext(action) },
          { role: "user", content: prompt },
        ],
        { maxTokens: 450, temperature: 0.35 },
      );
      return { reply, error: false };
    }

    default:
      throw new Error(`Unknown copilot action: ${action}`);
  }
}
