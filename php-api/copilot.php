<?php
// Nooks FP&A copilot API proxy.
// Lives at /api/copilot.php and proxies to Vercel AI Gateway, keeping the API
// key server-side. Routes by ?action= query param.
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
const MODEL   = 'google/gemini-3.1-pro-preview';

function call_gateway(string $apiKey, array $messages, int $maxTokens, float $temp, bool $jsonMode = false): string {
    $payload = [
        'model' => MODEL,
        'messages' => $messages,
        'max_tokens' => $maxTokens,
        'temperature' => $temp,
    ];
    if ($jsonMode) {
        $payload['response_format'] = ['type' => 'json_object'];
    }

    $ch = curl_init(GATEWAY);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_TIMEOUT        => 60,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            "Authorization: Bearer $apiKey",
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
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

function load_ground_truth(): string {
    $paths = [
        __DIR__ . '/ground-truth/nooks-ground-truth.md',
        dirname(__DIR__) . '/ai-knowledge/ground-truth/nooks-ground-truth.md',
    ];
    foreach ($paths as $path) {
        if (is_readable($path)) {
            return file_get_contents($path) ?: '';
        }
    }
    return '';
}

function extract_section(string $doc, string $heading): string {
    $escaped = preg_quote($heading, '/');
    if (!preg_match('/^##+\s+' . $escaped . '\s*$/m', $doc, $match, PREG_OFFSET_CAPTURE)) {
        return '';
    }
    $start = $match[0][1];
    $afterHeading = $start + strlen($match[0][0]);
    $rest = substr($doc, $afterHeading);
    if (preg_match('/\n##\s+/', $rest, $next, PREG_OFFSET_CAPTURE)) {
        return trim(substr($doc, $start, strlen($match[0][0]) + $next[0][1]));
    }
    return trim(substr($doc, $start));
}

function ground_truth_context(string $action): string {
    $rules = <<<TXT
Ground-truth rules:
- Treat the attached Nooks report as authoritative for public company, product, GTM, culture, hiring, and technical-positioning claims.
- Treat workspace finance/KPI JSON as private scenario data for this app, not public Nooks disclosure.
- If workspace data and public ground truth conflict, say which source you are using instead of blending them.
- Do not invent public pricing, valuation, patents, APIs, customers, or traction beyond the ground-truth report.
TXT;

    $sectionsByAction = [
        'ask-finance' => [
            'Executive summary',
            'Company overview and product surface',
            'Pricing and integration posture',
            'Product architecture, technical stack, and AI/ML approach',
            'Go-to-market and business model',
            'How to tailor your app and application',
        ],
        'variance-brief' => [
            'Executive summary',
            'Company overview and product surface',
            'Product architecture, technical stack, and AI/ML approach',
        ],
        'pricing-recommendation' => [
            'Executive summary',
            'Pricing and integration posture',
            'Go-to-market and business model',
        ],
        'vendor-rollout' => [
            'Executive summary',
            'Product architecture, technical stack, and AI/ML approach',
        ],
        'forecast-explainer' => [
            'Executive summary',
            'Product architecture, technical stack, and AI/ML approach',
        ],
    ];

    $doc = load_ground_truth();
    if (!$doc) {
        return $rules . "\n\nGround-truth report status: unavailable.";
    }

    $sections = $sectionsByAction[$action] ?? $sectionsByAction['ask-finance'];
    $excerpt = '';
    foreach ($sections as $heading) {
        $section = extract_section($doc, $heading);
        if ($section) $excerpt .= $section . "\n\n";
    }
    $excerpt = trim($excerpt) ?: substr($doc, 0, 18000);
    $excerpt = substr($excerpt, 0, 18000);

    return $rules . "\n\nGround-truth report: ai-knowledge/ground-truth/nooks-ground-truth.md\n\n" . $excerpt;
}

// ---------- Shared brand voice (Nooks FP&A copilot system prompt) ----------
$NOOKS_SYSTEM = <<<TXT
You are the in-house FP&A copilot for Nooks, an AI-native sales-tech company.

Context:
- Finance still runs much of the operating model in Sheets.
- AI Sequencing launched in February 2026 with usage-based economics.
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
- Ground claims in supplied data. Do not invent metrics, customers, or dates.
- Cite the driver when you cite a number.
- Separate facts from judgment and label uncertainty.
- Keep answers concise and board-ready.
- Avoid legal, tax, investment, or fairness-opinion framing.
- Cite the table/source in italics: *-- drawn from {source}*.
- Drop a Nooks-flavored phrase occasionally ("Ask Why", "More signal. Less spreadsheet.").
TXT;

try {
    switch ($action) {

        // ===== /api/copilot.php?action=ask-finance =====
        case 'ask-finance': {
            $messages = $body['messages'] ?? [];
            $context  = $body['context']  ?? null;
            $payload  = [
                ['role' => 'system', 'content' => $NOOKS_SYSTEM],
                ['role' => 'system', 'content' => ground_truth_context($action)],
            ];
            if ($context) {
                $payload[] = ['role' => 'system',
                    'content' => "Live workspace context (JSON):\n" . json_encode($context)];
            }
            foreach ($messages as $m) $payload[] = $m;
            $reply = call_gateway($apiKey, $payload, 700, 0.35);
            echo json_encode(['reply' => $reply ?: 'The agent is still listening.', 'error' => false]);
            break;
        }

        // ===== /api/copilot.php?action=variance-brief =====
        case 'variance-brief': {
            $period  = $body['period']  ?? 'unknown';
            $records = $body['records'] ?? [];
            $prompt = "Write a terse board variance brief for $period.\n"
                    . "Variance data JSON:\n" . json_encode($records, JSON_PRETTY_PRINT) . "\n\n"
                    . "Return ONLY a JSON object (no fences) of shape:\n"
                    . '{ "headline": string, "drivers": {"name":string,"impact_usd":number,"direction":"favorable"|"unfavorable"}[], "risks": string[], "recommendations": string[] }' . "\n"
                    . "Headline must include one specific dollar variance. Drivers must reflect favorable/unfavorable finance logic. Risks and recommendations should be concrete and non-alarmist.";
            $raw = call_gateway($apiKey,
                [['role' => 'system', 'content' => $NOOKS_SYSTEM],
                 ['role' => 'system', 'content' => ground_truth_context($action)],
                 ['role' => 'user',   'content' => $prompt]], 800, 0.25, true);
            $parsed = json_decode(strip_json_fence($raw), true);
            if (!$parsed) throw new RuntimeException('non-JSON response: ' . $raw);
            echo json_encode(array_merge($parsed, ['error' => false]));
            break;
        }

        // ===== /api/copilot.php?action=pricing-recommendation =====
        case 'pricing-recommendation': {
            $plays = $body['plays'] ?? [];
            $prompt = "Choose the strongest AI Sequencing pricing play for Nooks.\n"
                    . "Plays JSON:\n" . json_encode($plays, JSON_PRETTY_PRINT) . "\n\n"
                    . "Return ONLY a JSON object of shape:\n"
                    . '{ "recommended_id": string, "rationale": string, "risks": string[] }' . "\n"
                    . "Prefer the option that best balances ARR, NRR, gross margin, and Rule of 40. Rationale must cite at least two supplied numbers. Include 2-3 risks.";
            $raw = call_gateway($apiKey,
                [['role' => 'system', 'content' => $NOOKS_SYSTEM],
                 ['role' => 'system', 'content' => ground_truth_context($action)],
                 ['role' => 'user',   'content' => $prompt]], 650, 0.25, true);
            $parsed = json_decode(strip_json_fence($raw), true);
            if (!$parsed) throw new RuntimeException('non-JSON response: ' . $raw);
            echo json_encode(array_merge($parsed, ['error' => false]));
            break;
        }

        // ===== /api/copilot.php?action=vendor-rollout =====
        case 'vendor-rollout': {
            $models  = $body['models']  ?? [];
            $mix     = $body['mix']     ?? [];
            $prompt = "Recommend which LLM models Nooks should scale, pilot, or deprecate.\n"
                    . "Current mix JSON:\n"
                    . json_encode($mix, JSON_PRETTY_PRINT) . "\n\n"
                    . "Models tested JSON (cost/quality):\n" . json_encode($models, JSON_PRETTY_PRINT) . "\n\n"
                    . "Return ONLY a JSON object of shape:\n"
                    . '{ "scale": string[], "pilot": string[], "deprecate": string[], "rationale": string, "concentration_warning": string|null }' . "\n"
                    . "Each list must contain model_name strings from the input. Rationale must cite cost per action, quality, or concentration risk. Flag any vendor above 60% share.";
            $raw = call_gateway($apiKey,
                [['role' => 'system', 'content' => $NOOKS_SYSTEM],
                 ['role' => 'system', 'content' => ground_truth_context($action)],
                 ['role' => 'user',   'content' => $prompt]], 750, 0.25, true);
            $parsed = json_decode(strip_json_fence($raw), true);
            if (!$parsed) throw new RuntimeException('non-JSON response: ' . $raw);
            echo json_encode(array_merge($parsed, ['error' => false]));
            break;
        }

        // ===== /api/copilot.php?action=forecast-explainer =====
        case 'forecast-explainer': {
            $history = $body['history'] ?? [];
            $prompt = "Explain why LLM cost forecast accuracy is degrading.\n"
                    . "Use the supplied forecast-vs-actual history and reference the February 2026 Opus 4.7 tokenizer change only as a driver, not as the whole story if the data says otherwise.\n"
                    . "Return one paragraph of 3-4 sentences for a board packet. No JSON.\n\n"
                    . "History JSON:\n"
                    . json_encode($history, JSON_PRETTY_PRINT) . "\n\n"
                    . "End with one italic citation.";
            $reply = call_gateway($apiKey,
                [['role' => 'system', 'content' => $NOOKS_SYSTEM],
                 ['role' => 'system', 'content' => ground_truth_context($action)],
                 ['role' => 'user',   'content' => $prompt]], 450, 0.35);
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
