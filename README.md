# Orvel — codebase

Personalised, made-to-order sleep and ambient audio for shift workers. Live at **www.orvelsound.com**.

A customer answers a ~20-question brief (work schedule, sleep disruptions, sound preference). A producer builds their files and delivers MP3 + WAV within 24–48 hours. One-time pricing: USD $69 / $99 / $149, with an optional "Orvel Refresh" subscription.

Private repository. Mirrors `~/Desktop/Orvel` (code only — audio masters, reel footage and brand images stay local).

## Layout

| Path | What it is |
|---|---|
| `1-website-LIVE/` | The deployed site (Vercel project `orvel`). Static HTML + serverless API routes: Polar and Razorpay checkout, brief intake, Resend email, Meta CAPI. Niche landing pages for nurses, truckers, doctors, first responders, warehouse, factory, bankers, developers, menopause, new mums. |
| `2-website-NEXT/` | Work-ahead, not deployed: `/admin` studio console, Supabase schema, Razorpay webhook, intake-reminder cron. |
| `_tools/landing-pages/` | Python generator for the niche landing pages (`build.py` + `niches.py`). |
| `9-claude-skills/` | Claude skills that run Orvel's content pipeline (reel scripts, frames, Canva edit, Instagram posts, captions). |
| `8-reels/_tools/` | Reel asset ingest script. |
| `3-brand/`, `orvel-brand/` | Logo motion spec, brand kit, waveform data. |
| `6-notes/` | Payment-processor outreach notes. |
| `ORVEL-WORKSPACE.md` | The original folder guide from the Desktop workspace. |
| `server.js`, `emails.js`, `prompt_engine.js`, `render.yaml`, `Dockerfile` | Earlier Render-hosted backend (Aug 2026), superseded by the Vercel API routes in `1-website-LIVE/api/`. |

## Deploy

```bash
cd 1-website-LIVE
npx vercel --prod
```

Secrets live in Vercel environment variables. `.env.example` files list the keys; real `.env` files are never committed.

## Stack

Static HTML/CSS/JS · Vercel serverless functions (Node) · Supabase (Postgres) · Polar + Razorpay · Resend · Meta Pixel / Conversions API · Claude (development via Claude Code, and the content pipeline via the skills in `9-claude-skills/`)
