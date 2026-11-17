# Orvel Studio console — setup

Adds `orvelsound.com/admin`. Additive only: it does not modify `index.html`,
the three existing API routes, or `supabase-rls.sql`.

**Change the password you pasted into chat**, and give the studio account a
fresh random one from a password manager. It is never stored in these files —
Supabase Auth holds it.

---

## 1. Files

```
admin.html              → project root, next to index.html
api/admin-seed-brief.js → alongside your other api routes
api/public-config.js    → same
db/admin-schema.sql     → run in Supabase, not deployed
```

`vercel.json` already sets `cleanUrls: true`, so `admin.html` at the root serves
as `/admin` with no rewrite needed.

## 2. Database

Supabase → SQL Editor → run `db/admin-schema.sql`.

I ran it here against a reconstruction of `shift_track_submissions` built from
`sanitizeBrief()`, with your `supabase-rls.sql` applied first. It applies clean
and is safe to re-run. If your real table differs from what `submit-brief.js`
implies, the `add column if not exists` statements will still be fine.

It adds: an `admins` table, `is_admin()`, studio select/update policies, and
five fulfilment columns (`status`, `delivery_url`, `studio_notes`,
`delivered_at`, `is_test`). No insert policy — briefs still arrive only through
`/api/submit-brief` on the service role.

## 3. Your studio account

Authentication → Users → Add user. Email `advay2939@gmail.com`, a new random
password, tick Auto Confirm.

Authentication → Providers → Email → turn **off** Enable signups.

Then in SQL Editor:
```sql
insert into public.admins(email) values ('advay2939@gmail.com')
  on conflict (email) do nothing;
```
Auth alone isn't enough. This table is what `is_admin()` checks. Verified: an
account that signs in but isn't on this table is refused and signed straight
back out.

## 4. One new env var

Your DEPLOY.md list is missing this one:

| Variable | Value |
|---|---|
| `SUPABASE_ANON_KEY` | `sb_publishable_HcWFCuynYplhIX5WExoqHw_P4_iLc6z` |

It's the publishable key already sitting in `CONFIG` in `index.html` — public by
design. `/api/public-config` serves it so no key is pasted into the console file.

## 5. Check it

1. `/admin`, sign in.
2. **Seed test brief** → a synthetic Full Day brief appears, tagged TEST.
3. Open it. Four tracks, each with its Flow prompt and a **Copy Flow prompt**
   button, plus **Copy DSP config** giving the JSON block for `orvel_stack.py`.
4. Paste a delivery link, save, mark it delivered.

The seeded brief's `production_brief` mirrors the real shape that
`compileBrief()` writes, so what you see is what a paying customer produces.

---

## What this doesn't do yet

**The lockout is still live.** `S.order` and the intake token are plain JS
variables — no `localStorage` anywhere in `index.html`. A customer who closes
the tab after paying cannot get back into the questionnaire. That's next.

**Delivery emails aren't wired.** Marking a brief delivered sets the status and
saves the link; it doesn't send anything yet.

**Currency bug still open.** `create-order.js` sends `amount: plan.cents` while
accepting INR or USD. Harmless while `CONFIG.CURRENCY` is USD; it underprices
roughly sevenfold the moment INR is switched on.

**Brand hex: `#484DE5`.** Pulled from `ORVEL_LOGO_LIGHT.png`. Paper is `#F8F8EC`.
Your `:root` already carries the dark side of the logo exactly — `--navy:#141A2E`,
`--peri:#AEB2F5`, `--peri-soft:#C8CAFF`. The saturated blue was the one value
missing. The console uses this palette so the studio and the product match.
