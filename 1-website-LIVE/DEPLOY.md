# Orvel — deploy runbook
Domain: **orvelsound.com** · Vercel project: **orvel**

---

## 1. Deploy

Unzip, then from the `orvel/` folder:

```bash
npx vercel login
npx vercel            # preview deploy first — do NOT go straight to prod
```

Setup prompts: link to existing project → **Yes** if an Orvel project already
exists, otherwise **No** and name it `orvel`. Directory `./`. Override
settings **No**.

## 2. Environment variables

Vercel dashboard → project → Settings → Environment Variables. Add all of
these to **Production** (and Preview if you want the preview URL to work).
Template is in `.env.example`.

| Variable | Notes |
|---|---|
| `RAZORPAY_KEY_ID` | live key id once KYC clears; test key until then |
| `RAZORPAY_KEY_SECRET` | **secret — server only** |
| `INTAKE_TOKEN_SECRET` | generate: `openssl rand -base64 48` |
| `SUPABASE_URL` | `https://wkphjusboqvdhwfokuhn.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | **secret — bypasses RLS, server only** |
| `RESEND_API_KEY` | for the studio alert |
| `STUDIO_EMAIL` | where new-brief alerts land |
| `FROM_EMAIL` | needs a verified domain in Resend |

Also update `CONFIG.RAZORPAY_KEY_ID` in `index.html` — it is the *public*
key id and is meant to be visible. It is currently `rzp_test_REPLACE_ME`.

## 3. Database

Supabase → SQL Editor → run `supabase-rls.sql`. This is what actually stops
a forged brief. Without it the table still accepts anon inserts.

## 4. Custom domain

Vercel → project → Settings → Domains → add `orvelsound.com` and
`www.orvelsound.com`. Vercel prints the records. At Namecheap → Domain List →
orvelsound.com → Manage → Advanced DNS, set **Nameservers to Custom** or add
the A/CNAME records Vercel gives you. SSL issues automatically once DNS
propagates (minutes to a few hours).

## 5. Verify before announcing

- [ ] Page loads, intro plays, all five soundscapes play and **scrub**
- [ ] Checkout with a Razorpay **test** card creates a real order
- [ ] Network tab: `/api/create-order` returns an `orderId`
- [ ] Console: `window.ORVEL.previewPostPurchase` is **undefined**
- [ ] Forged insert is refused — in console:
      `await fetch('/api/submit-brief',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({intakeToken:'fake.fake',brief:{}})})`
      → expect **401 payment_not_verified**
- [ ] Brief row lands in `shift_track_submissions` after a real test payment

---

## What changed from your local build

1. **`/api/create-order`** — written from scratch. Prices from `packageId`
   only; a mismatched browser amount is logged and ignored.
2. **`/api/verify-payment`** — HMAC signature check, then mints a signed
   6-hour intake token.
3. **`/api/submit-brief`** — new. The only path to the database. Requires the
   token; takes `package_id` and `payment_ref` from the token, not the body;
   whitelists columns.
4. **Front-end** no longer inserts to Supabase with the publishable key.
5. **`previewPostPurchase` removed** — it set paid state with no payment.
6. **Audio** 161 MB WAV → 14 MB AAC, all five wired, faststart for scrubbing.
7. **`orvel_test_key.csv` excluded** — it contained a Razorpay key secret.
   Rotate that test secret in the Razorpay dashboard.

## Still open

- `MEDIA.photos` slots are empty (SVG fallbacks holding layout)
- Brand hex still needed for the Canva template layer
- Lifecycle emails beyond the studio alert are not built
- Razorpay international KYC — submit once the domain resolves
