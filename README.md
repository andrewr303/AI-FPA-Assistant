# AI FP&A Expert

A production-style, AI-native FP&A workspace for finance leaders who need fast answers, scenario planning, and board-ready narratives.

**Live domain:** [fpa.andrewvrodriguez.com](https://fpa.andrewvrodriguez.com)

## What this project is

AI FP&A Expert is an interactive finance operating workspace built to demonstrate full-stack product engineering skills across:

- Modern frontend architecture (React + TypeScript + TanStack Router)
- AI copilot integrations with secure server-side proxy patterns
- Scenario and analytics modules for pricing, margin, forecast, and variance analysis
- Production-oriented deployment patterns (Vite, Supabase edge functions, PHP fallback proxy)

This repository intentionally includes realistic mock finance data so the app is immediately usable out-of-the-box while still supporting user-provided company context and custom datasets.

## Core features

- **Executive KPI dashboard** with trend signals and operational alerts
- **Pricing and margin simulators** for tradeoff modeling
- **Variance narration** that turns numbers into board-ready written commentary
- **Vendor/model portfolio analysis** for AI cost + quality decisions
- **Copilot chat workspace** with context-aware FP&A responses
- **Customizable company context** so users can set their own company name and pass their own data
- **Bring-your-own API key** support for OpenAI-compatible gateway use

## Bring your own data and API key

Inside the copilot drawer, users can now provide:

1. **Company name** (persisted locally)
2. **OpenAI API key** (persisted locally in browser storage)
3. **Custom data JSON** to augment responses with user-specific context

The app sends this context with copilot calls so responses can be adapted to each user environment without changing the bundled demo dataset.

## Tech stack

- **Frontend:** React, TypeScript, Vite, TanStack Router, Tailwind CSS
- **AI Integration:** Gateway-style chat completions via server proxy
- **Server options:** Supabase Edge Function and PHP proxy fallback
- **UI:** Custom component system + utility primitives

## Local development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build and quality checks

```bash
npm run build
npm run lint
```

## Deployment notes

- Configure the app domain to: `fpa.andrewvrodriguez.com`
- You can run with either:
  - Supabase function backend, or
  - PHP API proxy backend
- If a user does not provide an API key in-app, the server falls back to `AI_GATEWAY_API_KEY` when available.

## Why this repo exists

This project is meant to be public and portfolio-grade: a concrete demonstration of product thinking, frontend craft, AI integration patterns, and practical financial domain UX.

---

If you’re reviewing this repo, the best place to start is the copilot workflow plus pricing and variance modules.
