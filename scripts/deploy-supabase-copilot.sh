#!/usr/bin/env bash
# Deploy the Supabase Edge Function `copilot` and its AI_GATEWAY_API_KEY secret.
#
# Why this exists:
#   The production SPA bundle is built with VITE_SUPABASE_URL and prefers
#   `${SUPABASE_URL}/functions/v1/copilot/<action>` over the PHP `/api/<action>`
#   fallback. If Supabase doesn't have the function deployed (or the key set),
#   every AI call 404s and the UI falls back to canned responses.
#
# Prereqs (one-time):
#   npm i -g supabase
#   supabase login
#
# Usage:
#   bash scripts/deploy-supabase-copilot.sh
#
# Idempotent: safe to re-run after edits to supabase/functions/copilot/index.ts.

set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "ERROR: .env not found. Run from repo root with .env present (must contain AI_GATEWAY_API_KEY)."
  exit 1
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "ERROR: supabase CLI not installed. Run: npm i -g supabase"
  exit 1
fi

PROJECT_REF=$(grep -E '^VITE_SUPABASE_PROJECT_ID=' .env | sed -E 's/^[^=]+=//;s/^"//;s/"$//')
if [ -z "$PROJECT_REF" ]; then
  echo "ERROR: VITE_SUPABASE_PROJECT_ID missing from .env"
  exit 1
fi

AI_KEY=$(grep -E '^AI_GATEWAY_API_KEY=' .env | sed -E 's/^[^=]+=//;s/^"//;s/"$//')
if [ -z "$AI_KEY" ]; then
  echo "ERROR: AI_GATEWAY_API_KEY missing from .env"
  exit 1
fi

echo "==> Linking project $PROJECT_REF"
supabase link --project-ref "$PROJECT_REF" >/dev/null 2>&1 || true

echo "==> Setting AI_GATEWAY_API_KEY secret on Supabase"
supabase secrets set "AI_GATEWAY_API_KEY=$AI_KEY" --project-ref "$PROJECT_REF"

echo "==> Deploying copilot edge function"
supabase functions deploy copilot --project-ref "$PROJECT_REF" --no-verify-jwt

echo
echo "==> Smoke test"
ENDPOINT="https://$PROJECT_REF.supabase.co/functions/v1/copilot/ask-finance"
RESP=$(curl -s -o /tmp/copilot-smoke.json -w "%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Reply with the single word: pong"}]}')
echo "POST $ENDPOINT -> HTTP $RESP"
head -c 400 /tmp/copilot-smoke.json
echo
echo
if [ "$RESP" = "200" ]; then
  echo "SUCCESS: AI gateway is live."
else
  echo "FAILED: see response above. Check Supabase function logs:"
  echo "  supabase functions logs copilot --project-ref $PROJECT_REF"
fi
