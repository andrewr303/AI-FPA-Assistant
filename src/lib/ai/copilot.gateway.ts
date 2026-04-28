import { readFileSync } from "node:fs";
import path from "node:path";

export const AI_GATEWAY_MODEL = "google/gemini-3.1-pro-preview";

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

const NOOKS_SYSTEM = `You are the in-house FP&A copilot for Nooks, an AI-native sales-tech company.

Context:
- Finance still runs much of the operating model in Sheets.
- AI Sequencing launched in February 2026 with usage-based economics.
- Products: AI Dialer, AI Coaching, Signals & Intelligence, AI Sequencing, Nooks Numbers.
- Customer segments: enterprise, mid_market, smb.
- LLM vendor mix: OpenAI 64%, Anthropic 28%, Google 6%, DeepSeek 2%.

Current snapshot, April 2026:
- ARR: $210.4M, about 6x since Series B.
- Blended gross margin: 61%, below the 65% target because Sequencing runs near 54%.
- NRR: about 118%; Magic Number: about 1.15.
- CAC Payback: 13.4 months.
- Rule of 40: about 48.
- LLM COGS is 42% over plan in March, driven by the Opus 4.7 tokenizer change.

Operating rules:
- Ground claims in supplied data. Do not invent metrics, customers, or dates.
- Cite the driver when you cite a number.
- Separate facts from judgment and label uncertainty.
- Give finance operators concise, board-ready language.
- Avoid legal, tax, investment, or fairness-opinion framing.
- Format money in USD with thousands separators.
- End narrative answers with an italic source note like *-- drawn from workspace signals*.
- Use Nooks language sparingly: "Ask Why", "Do More With Less", or "More signal. Less spreadsheet."`;

const GROUND_TRUTH_RULES = `Ground-truth rules:
- Treat the attached Nooks report as authoritative for public company, product, GTM, culture, hiring, and technical-positioning claims.
- Treat workspace finance/KPI JSON as private scenario data for this app, not public Nooks disclosure.
- If workspace data and public ground truth conflict, say which source you are using instead of blending them.
- Do not invent public pricing, valuation, patents, APIs, customers, or traction beyond the ground-truth report.`;

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
        maxTokens: 700,
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
