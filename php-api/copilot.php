<?php
// Nooks FP&A copilot — Hostinger PHP proxy.
// Lives at /api/copilot.php on Hostinger and proxies to Vercel AI Gateway,
// keeping the API key server-side. Routes by ?action= query param.
//
// Required env (set in Hostinger hPanel → Advanced → PHP Configuration → Env Variables,
// or in a .env file outside public_html and load via getenv()):
//   AI_GATEWAY_API_KEY  — your Vercel AI Gateway key
// Optional:
//   ALLOWED_ORIGIN       — restrict CORS (default *)

declare(strict_types=1);
header('Content-Type: application/json');
$origin = getenv('ALLOWED_ORIGIN') ?: '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['error' => 'method not allowed']); exit;
}

$apiKey = getenv('AI_GATEWAY_API_KEY');
if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'AI_GATEWAY_API_KEY not configured on the server']); exit;
}

$action = $_GET['action'] ?? '';
$body   = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];

const GATEWAY = 'https://ai-gateway.vercel.sh/v1/chat/completions';
const MODEL   = 'anthropic/claude-sonnet-4.5';

function call_gateway(string $apiKey, array $messages, int $maxTokens, float $temp): string {
    $ch = curl_init(GATEWAY);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_TIMEOUT        => 60,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            "Authorization: Bearer $apiKey",
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'model' => MODEL,
            'messages' => $messages,
            'max_tokens' => $maxTokens,
            'temperature' => $temp,
        ]),
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code < 200 || $code >= 300) {
        throw new RuntimeException("gateway $code: $resp");
    }
    $json = json_decode($resp, true);
    return trim($json['choices'][0]['message']['content'] ?? '');
}

function strip_json_fence(string $s): string {
    $s = preg_replace('/^```(?:json)?\s*/i', '', $s);
    return preg_replace('/\s*```\s*$/i', '', $s);
}

// ---------- Shared brand voice (Nooks FP&A copilot system prompt) ----------
$NOOKS_SYSTEM = <<<TXT
You are the in-house FP&A copilot for Nooks, an AI-native sales-tech company.
Their finance team is "all in Sheets" and just launched AI Sequencing in February 2026 with usage-based pricing.
Products: AI Dialer, AI Coaching, Signals & Intelligence, AI Sequencing, Nooks Numbers.
Customer segments: enterprise, mid_market, smb.
LLM vendors: OpenAI (64% mix), Anthropic (28%), Google (6%), DeepSeek (2%).

Operating principles:
- "Ask Why" — when you cite a number, cite its driver too.
- "Do More With Less" — answer in the fewest words that solve the problem.
- "Earn Customer Love" — your audience is VP Finance, CRO Hannah Willson, CEO Dan Lee.

Snapshot (April 2026):
- ARR: \$210.4M (6× since Series B)
- Blended GM: 61% (below 65% target — Sequencing at 54% drags blend)
- NRR: ~118%, Magic Number: ~1.15
- CAC Payback: 13.4 mo (just drifted past 12)
- Rule of 40: ~48
- LLM COGS running 42% over plan in March — driver: Opus 4.7 tokenizer change.

Format:
- Numbers in USD with thousands separators.
- Short paragraph. No bullets unless asked.
- Cite the table/source in italics: *— drawn from {source}*.
- Drop a Nooks-flavored phrase occasionally ("Ask Why", "More signal. Less spreadsheet.").
TXT;

try {
    switch ($action) {

        // ===== /api/copilot.php?action=ask-finance =====
        case 'ask-finance': {
            $messages = $body['messages'] ?? [];
            $context  = $body['context']  ?? null;
            $payload  = [['role' => 'system', 'content' => $NOOKS_SYSTEM]];
            if ($context) {
                $payload[] = ['role' => 'system',
                    'content' => "Live workspace context (JSON):\n" . json_encode($context)];
            }
            foreach ($messages as $m) $payload[] = $m;
            $reply = call_gateway($apiKey, $payload, 600, 0.4);
            echo json_encode(['reply' => $reply ?: 'The agent is still listening.', 'error' => false]);
            break;
        }

        // ===== /api/copilot.php?action=variance-brief =====
        case 'variance-brief': {
            $period  = $body['period']  ?? 'unknown';
            $records = $body['records'] ?? [];
            $prompt = "You are Dan Lee writing a terse board variance brief for $period.\n"
                    . "Variance data:\n" . json_encode($records, JSON_PRETTY_PRINT) . "\n\n"
                    . "Return ONLY a JSON object (no fences) of shape:\n"
                    . '{ "headline": string, "drivers": {"name":string,"impact_usd":number,"direction":"favorable"|"unfavorable"}[], "risks": string[], "recommendations": string[] }' . "\n"
                    . "Headline must include a specific dollar number. Drop one Nooks-flavored phrase.";
            $raw = call_gateway($apiKey,
                [['role' => 'system', 'content' => $NOOKS_SYSTEM],
                 ['role' => 'user',   'content' => $prompt]], 700, 0.3);
            $parsed = json_decode(strip_json_fence($raw), true);
            if (!$parsed) throw new RuntimeException('non-JSON response: ' . $raw);
            echo json_encode(array_merge($parsed, ['error' => false]));
            break;
        }

        // ===== /api/copilot.php?action=pricing-recommendation =====
        case 'pricing-recommendation': {
            $plays = $body['plays'] ?? [];
            $prompt = "You are advising Nooks on pricing for AI Sequencing. Pick the strongest play.\n"
                    . "Plays:\n" . json_encode($plays, JSON_PRETTY_PRINT) . "\n\n"
                    . "Return ONLY a JSON object of shape:\n"
                    . '{ "recommended_id": string, "rationale": string, "risks": string[] }' . "\n"
                    . "Rationale must reference at least one specific number. Risks: 2-3 items.";
            $raw = call_gateway($apiKey,
                [['role' => 'system', 'content' => $NOOKS_SYSTEM],
                 ['role' => 'user',   'content' => $prompt]], 600, 0.3);
            $parsed = json_decode(strip_json_fence($raw), true);
            if (!$parsed) throw new RuntimeException('non-JSON response: ' . $raw);
            echo json_encode(array_merge($parsed, ['error' => false]));
            break;
        }

        // ===== /api/copilot.php?action=vendor-rollout =====
        case 'vendor-rollout': {
            $models  = $body['models']  ?? [];
            $mix     = $body['mix']     ?? [];
            $prompt = "Recommend an LLM vendor rollout for Nooks. Current mix:\n"
                    . json_encode($mix, JSON_PRETTY_PRINT) . "\n\n"
                    . "Models tested (cost/quality):\n" . json_encode($models, JSON_PRETTY_PRINT) . "\n\n"
                    . "Return ONLY a JSON object of shape:\n"
                    . '{ "scale": string[], "pilot": string[], "deprecate": string[], "rationale": string, "concentration_warning": string|null }' . "\n"
                    . "Each list contains model_name strings. Rationale must reference cost or concentration risk.";
            $raw = call_gateway($apiKey,
                [['role' => 'system', 'content' => $NOOKS_SYSTEM],
                 ['role' => 'user',   'content' => $prompt]], 700, 0.3);
            $parsed = json_decode(strip_json_fence($raw), true);
            if (!$parsed) throw new RuntimeException('non-JSON response: ' . $raw);
            echo json_encode(array_merge($parsed, ['error' => false]));
            break;
        }

        // ===== /api/copilot.php?action=forecast-explainer =====
        case 'forecast-explainer': {
            $history = $body['history'] ?? [];
            $prompt = "Forecast vs actual for Nooks (last 6 months):\n"
                    . json_encode($history, JSON_PRETTY_PRINT) . "\n\n"
                    . "Write ONE paragraph (3-4 sentences) explaining why LLM cost forecast accuracy is degrading. "
                    . "Reference the Opus 4.7 tokenizer change of February 2026. End with one italic citation. "
                    . "Return plain text only — no JSON, no fences.";
            $reply = call_gateway($apiKey,
                [['role' => 'system', 'content' => $NOOKS_SYSTEM],
                 ['role' => 'user',   'content' => $prompt]], 400, 0.4);
            echo json_encode(['reply' => $reply, 'error' => false]);
            break;
        }

        default:
            http_response_code(404);
            echo json_encode(['error' => "unknown action: $action"]);
    }
} catch (Throwable $e) {
    error_log('[copilot] ' . $e->getMessage());
    http_response_code(502);
    echo json_encode(['error' => 'copilot upstream failure']);
}
