# Orvel — what's in this folder

Reorganised 9 Sep 2026. Folders are numbered in order of importance, so the
two that matter are always at the top.

---

## `1-website-LIVE/`

**This is the site.** Byte-for-byte what is deployed at **www.orvelsound.com**,
plus the 9 Sep support-email change, which has not been pushed yet.

Deploy from here and nowhere else:

```bash
cd ~/Desktop/Orvel/1-website-LIVE
npx vercel --prod
```

Linked to Vercel project `orvel` (`prj_2OPBmt5s05QeXBqaxY1QGNmB2TuC`). The
`.vercel` link lives inside the folder, so renaming it changed nothing.

Contains: `index.html` (the whole site — landing page, questionnaire, checkout,
legal modals), the four legal pages, 4 API routes, the 5 web-optimised `.m4a`
soundscapes, both logos.

## `2-website-NEXT/`

**Work-ahead. Not deployed.** Everything in `1-website-LIVE` plus:

- `/admin` studio console — `admin.html`, `api/admin-seed-brief.js`, `api/public-config.js`, `admin-schema.sql`, `ADMIN-SETUP.md`
- `api/razorpay-webhook.js`, `api/cron-intake-reminder.js`
- `api/_email.js`, `api/_catalog.js`, `api/_db.js`, `supabase-schema.sql`
- real waveform data for all five soundscapes, a `/contact` footer link, per-currency pricing

Deploying this ships a batch of unreviewed changes at once. Review it, then
either fold the pieces into `1-website-LIVE` or promote this folder to live.

## `3-brand/`

| File | What it's for |
|---|---|
| `orvel-logo-dark.png` | logo on dark ground — this is the one the site and emails use |
| `orvel-logo-light.png` | logo on light ground |
| `orvel-logo-animation-dark.mp4` | animated logo, dark |
| `orvel-logo-animation-light.mp4` | animated logo, light |
| `orvel-logo-motion-system.html` | open in a browser — the motion spec: timings, easing, the breathing loop |

## `4-audio-masters/`

The five soundscape WAV masters. The compressed `.m4a` versions the site
actually serves live inside each website folder under `audio/`.

Deep Current · Deep Drift · Deep Submersion · Subsurface · Undertow

## `5-archive/`

`2026-08-26-homepage-alternate-design.html` — a standalone alternate homepage
design from 26 Aug. Superseded, kept for reference only.

## `6-notes/`

`payment-processor-outreach.md` — the note on approaching payment processors.

---

## Open items on the site

1. `CONFIG.RAZORPAY_KEY_ID` in `index.html` is still `rzp_test_REPLACE_ME`.
2. `contact.html` has no business address or phone. Razorpay's merchant review
   looks for both — a likely reason the account hasn't moved.
3. The hero five-star review has no customer behind it.
4. INR pricing is unset, so an INR order is refused rather than underpriced.
