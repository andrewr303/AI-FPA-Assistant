# Deploying to Hostinger

This repo was migrated from a Lovable / TanStack Start (Cloudflare Worker) setup
to a static SPA so it can run on Hostinger shared hosting.

## What changed

- `@tanstack/react-start` (SSR) → plain `@tanstack/react-router` (SPA).
- Cloudflare Worker entry (`wrangler.jsonc`, `@cloudflare/vite-plugin`) → standard Vite static build.
- Lovable's bundled vite config (`@lovable.dev/vite-tanstack-config`) → vanilla `vite.config.ts`.
- Server functions in `src/lib/ai/copilot.functions.ts` are now client-side
  fetches against an optional `VITE_COPILOT_API_URL`. If unset, the copilot runs
  in "demo mode" and returns a placeholder response. Host your own API
  (Cloudflare Worker, Vercel function, etc.) and set the env var to wire it back up.
- `public/.htaccess` added — Apache rewrite so deep links (`/treasury`,
  `/signal-desk`, …) fall back to `index.html` instead of returning 403/404.
- `.github/workflows/deploy-hostinger.yml` added — builds on push to `main` and
  FTPs `dist/` to Hostinger.

## One-time Hostinger setup

1. In Hostinger hPanel, create an FTP account scoped to your domain's
   `public_html/` (or a subfolder if you want the app under a path).
2. In GitHub repo Settings → Secrets and variables → Actions, add:
   - `HOSTINGER_FTP_HOST` — e.g. `ftp.yourdomain.com`
   - `HOSTINGER_FTP_USER`
   - `HOSTINGER_FTP_PASSWORD`
   - `HOSTINGER_FTP_DIR` — e.g. `/public_html/` (trailing slash matters)
   - `VITE_COPILOT_API_URL` — optional, set if you've hosted the copilot API somewhere
3. Make sure Hostinger has `mod_rewrite` and `mod_headers` enabled (they are by
   default on shared plans). The `.htaccess` won't work without them.
4. Push to `main` — the workflow builds and uploads `dist/` automatically.

## Running locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to ./dist
npm run preview  # serve the built dist locally
```

## Wiring up the AI copilot (PHP, lives on Hostinger itself)

The Ask Finance drawer (and every other AI button — variance brief, pricing
recommendation, vendor rollout, forecast explainer) runs in "demo mode" until
the PHP proxy is configured on Hostinger.

The proxy is a single file: `php-api/copilot.php`. The deploy workflow already
copies it (and its `.htaccess`) into `dist/api/` before the FTP push, so it
ships alongside the SPA on the same domain.

**One-time Hostinger setup:**

1. After your first deploy, in **hPanel → Files → File Manager**, confirm
   `public_html/api/copilot.php` and `public_html/api/.htaccess` exist.
2. **hPanel → Advanced → PHP Configuration → PHP Variables**, add:
   - `AI_GATEWAY_API_KEY` = `vck_…` (your Vercel AI Gateway key)
   - Optional: `ALLOWED_ORIGIN` = `https://nooks.andrewvrodriguez.com` (locks
     CORS to your domain instead of `*`)
3. In GitHub Actions secrets, set `VITE_COPILOT_API_URL` to `/api`
   (relative — no CORS issues since same origin).
4. Confirm Hostinger's PHP version is 7.4+ (8.x preferred).

**Endpoints (all POST, JSON in/out):**

| Path | Purpose |
| --- | --- |
| `/api/ask-finance` | Conversational copilot drawer |
| `/api/variance-brief` | Structured exec brief from variance records |
| `/api/pricing-recommendation` | Pick the strongest pricing play |
| `/api/vendor-rollout` | Scale/pilot/deprecate decisions across LLM models |
| `/api/forecast-explainer` | One-paragraph note on forecast calibration |

Each endpoint composes a tuned system prompt grounded in the Nooks brand voice
(Operating Principles, current snapshot, formatting rules) and proxies the
request to Vercel AI Gateway with the key kept server-side. See `php-api/copilot.php`.

If you'd rather not run PHP, the same five endpoints can be hosted on any
JS-capable runtime (Cloudflare Worker, Vercel function, Hostinger VPS Node);
just point `VITE_COPILOT_API_URL` at it.
