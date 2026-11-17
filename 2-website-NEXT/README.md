# Orvel — running and maintaining the system

Live at **https://www.orvelsound.com** · Vercel project `orvel`

---

## The one-line mental model

Razorpay takes the money → **the webhook** tells your server → the server emails
the customer a link to the brief → they fill it in → the brief lands in Supabase
and you get a studio alert → you produce and deliver.

The browser is never trusted with price, package, or whether payment happened.

---

## Where to change things

| To change… | Edit only this |
|---|---|
| A price, package name, track count | `api/_catalog.js` |
| Any email wording, subject, colour | `api/_email.js` |
| Brand colours, fonts | top of `index.html` (`:root`), mirrored in `api/_email.js` (`C`) |
| Policy wording | `privacy.html` · `terms.html` · `refund.html` · `contact.html` |
| Database shape or permissions | `supabase-schema.sql`, then re-run it |
| Reminder timing | `WAIT_HOURS` / `GIVE_UP_DAYS` in `api/cron-intake-reminder.js` |
| Who can open `/admin` | the `admins` table in Supabase |

**Prices live in exactly one place.** `index.html` shows them for display; the
server prices from `_catalog.js` and ignores anything the browser claims. If the
two drift, `create-order` logs a warning and charges the correct amount.

---

## Deploying

```bash
npx vercel --prod
```

That's the whole process. Static files, API routes and cron all ship together.

---

## First-time setup (once, in this order)

**1. Database** — Supabase → SQL Editor → run `supabase-schema.sql`.
Safe to re-run any time; it's also the migration file.

**1b. Admin layer** — SQL Editor → run `admin-schema.sql`. Adds the `admins`
table, `is_admin()`, the studio read/update policies, and five fulfilment
columns. Additive and safe to re-run.

Then create the studio account: Authentication → Users → Add user,
`advay2939@gmail.com`, a freshly generated password, Auto Confirm on.
Authentication → Providers → Email → turn **off** Enable signups. Then:

```sql
insert into public.admins(email) values ('advay2939@gmail.com')
  on conflict (email) do nothing;
```

Auth membership alone grants nothing — `is_admin()` reads this table.

**2. Environment variables** — Vercel → Settings → Environment Variables,
scope **Production**. Template in `.env.example`.

Generate the two secrets yourself:
```bash
openssl rand -base64 48   # INTAKE_TOKEN_SECRET
openssl rand -base64 32   # CRON_SECRET
```

**3. Razorpay webhook** — Dashboard → Settings → Webhooks → Add:
- URL `https://www.orvelsound.com/api/razorpay-webhook`
- Secret: same string as `RAZORPAY_WEBHOOK_SECRET`
- Event: `payment.captured`

**4. Resend** — Domains → orvelsound.com → verify. DNS records are already in
place at Namecheap.

**5. Live key in the page** — `index.html`, `CONFIG.RAZORPAY_KEY_ID` →
`rzp_live_T6PExaXK4mKBPf`. This one is public by design.

---

## The seven emails

| # | Trigger | Sent by |
|---|---|---|
| 1 | Payment captured | `razorpay-webhook.js` |
| 2 | 24h, no brief | `cron-intake-reminder.js` (daily 09:00 UTC) |
| 3 | Brief submitted | `submit-brief.js` |
| 4 | You deliver | *manual — call `sendEmail` with `delivery`* |
| 5 | You deliver a revision | *manual — `revisionDelivered`* |
| 6 | Brief submitted → you | `submit-brief.js` |
| 7 | Revision requested → you | *wire when the revision form exists* |

4, 5 and 7 have finished templates but no automatic trigger yet — they wait on
the delivery flow and admin console.

**Sending twice is impossible.** Every send claims a row in `email_log` first;
a unique index means a Razorpay retry can't produce a second receipt.

---

## Checks after deploying

- [ ] `https://www.orvelsound.com` loads, all five soundscapes scrub
- [ ] `/privacy` `/terms` `/refund` `/contact` load as real pages
- [ ] Test-mode payment → receipt arrives → link opens the brief
- [ ] Console: `window.ORVEL.previewPostPurchase` is `undefined`
- [ ] Forged brief is refused:
  ```js
  await fetch('/api/submit-brief',{method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({intakeToken:'fake.fake',brief:{}})})
  ```
  → expect **401 payment_not_verified**
- [ ] Razorpay → Webhooks → recent deliveries shows 200

---

## When something breaks

**No receipt.** Razorpay → Webhooks → delivery log. 401/400 means
`RAZORPAY_WEBHOOK_SECRET` doesn't match. 200 but no email means Resend isn't
verified or `RESEND_API_KEY` is missing — check Vercel → Logs.

**Emails land in spam.** Resend → domain still verified? Then tighten DMARC from
`p=none` to `p=quarantine` once you've sent real mail for a few weeks.

**Reminder didn't send.** Vercel → Cron. Needs `CRON_SECRET` set and
`orders.brief_received` to be false.

**Brief rejected with 401.** The intake token expired (14 days) or
`INTAKE_TOKEN_SECRET` changed. Changing that secret invalidates every
outstanding brief link — don't rotate it casually.

---

## Security invariants — don't undo these

- Price comes from `_catalog.js`, server-side. Never from the browser.
- A brief requires a signed token minted only after a verified payment.
- `SUPABASE_SERVICE_ROLE_KEY` and `RAZORPAY_KEY_SECRET` never reach the client.
- RLS is on with no anon policy for `orders`, `email_log`,
  `shift_track_submissions`. Only the service role writes.
- No fabricated reviews, order counts, or activity. The activity feed stays
  dormant until `RECENT_ORDERS_ENDPOINT` returns real data.

---

## Still open

- Hero still shows a five-star review with no customers behind it — remove or
  replace with something true.
- `hello@orvelsound.com` sends but doesn't receive. Set up forwarding.
- `MEDIA.photos` slots are empty; SVG fallbacks hold the layout.
- Delivery + revision flow (emails 4, 5, 7) needs the admin console.
- Rotate the Razorpay **test** secret that was in `orvel_test_key.csv`.
- `contact.html` has no postal address or phone number. Razorpay's merchant
  review looks for both.
- `CONFIG.RAZORPAY_KEY_ID` in `index.html` is still `rzp_test_REPLACE_ME`.
- INR prices in `api/_catalog.js` are `null`, so an INR order is refused with
  400 `currency_unavailable`. Fill them in before switching `CONFIG.CURRENCY`.
- Post-payment lockout: `S.order` and the intake token are plain JS variables.
  A customer who closes the tab after paying cannot get back into the
  questionnaire. Watch for paid orders with no matching brief row.

---

## The studio console

`/admin` — sign in with the Supabase account that is listed in `admins`.
An account that authenticates but isn't on that table is refused and signed
back out.

- **Seed test brief** posts to `/api/admin-seed-brief`, which re-checks the
  caller against `admins` on the service role before writing. The row is
  tagged `is_test`.
- Each track shows its Flow prompt with a copy button, plus **Copy DSP config**
  for `orvel_stack.py`.
- Status, studio notes and the delivery link save straight to
  `shift_track_submissions` under the `admin_update_briefs` policy.

Marking a brief delivered records the status and the link. It does not send
email — templates 4, 5 and 7 in `_email.js` still have no trigger.
