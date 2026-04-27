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

## Wiring up the AI copilot (optional)

The Ask Finance drawer runs in "demo mode" out of the box. To make it actually
call an LLM:

```bash
cd copilot-api
npm install
npx wrangler login
npx wrangler secret put AI_GATEWAY_API_KEY   # paste your Vercel AI Gateway key
npx wrangler deploy
```

Wrangler prints the deployed Worker URL (e.g. `https://nooks-copilot-api.<you>.workers.dev`).
Add that as the `VITE_COPILOT_API_URL` GitHub Actions secret and re-run the
deploy workflow — the SPA will start hitting it automatically.

For tighter security, edit `copilot-api/wrangler.toml` and set
`ALLOWED_ORIGIN` to your Hostinger domain (e.g.
`https://nooks.andrewvrodriguez.com`) instead of `*`.

## Why not Cloudflare Pages / Vercel for the SPA?

You can — the SPA build works on any static host. The Hostinger flow exists
because that's what was asked for; the Cloudflare Worker copilot above is the
only piece that *must* live on a JS-capable runtime.
