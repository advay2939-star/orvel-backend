/* ═══════════════════════════════════════════════════════════════
   POST /api/verify-polar

   The Polar twin of /api/verify-payment. Given a checkout id, it asks
   Polar what actually happened — never the browser — and only on a
   real payment mints the same short-lived signed intake token that
   /api/submit-brief demands. submit-brief is unchanged: it cannot
   tell which rail paid, only that the token is genuine.
═══════════════════════════════════════════════════════════════ */
import { signToken } from './verify-payment.js';
import { sendEmail } from './_email.js';
import { sendPurchase } from './_meta.js';
import {
  CATALOG, packageIdForProduct, polarFetch, siteUrl, safeJson,
} from './_polar.js';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 6;   // 6 hours, same as the Razorpay path

/* 'succeeded' is settled. 'confirmed' means Polar has taken the
   payment and is finishing up; the embed fires success at that point,
   so we allow it after a short wait rather than making a paying
   customer stare at an error. Polar's webhook remains the source of
   truth for the order itself. */
const SETTLED   = new Set(['succeeded']);
const IN_FLIGHT = new Set(['confirmed']);

const sleep = ms => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const tokenSecret = process.env.INTAKE_TOKEN_SECRET;
  if (!tokenSecret || !process.env.POLAR_ACCESS_TOKEN) {
    console.error('verify-polar: env vars missing');
    return res.status(500).json({ verified: false, error: 'not_configured' });
  }

  const body = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
  const checkoutId = String(body.checkoutId || '').trim();
  if (!checkoutId) {
    return res.status(400).json({ verified: false, error: 'missing_checkout_id' });
  }

  /* ── Ask Polar. Poll briefly while the payment settles. ── */
  let checkout = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await polarFetch(`/v1/checkouts/${encodeURIComponent(checkoutId)}`);
    if (r.status === 404) {
      console.warn('verify-polar: unknown checkout', checkoutId);
      return res.status(404).json({ verified: false, error: 'unknown_checkout' });
    }
    if (!r.ok) {
      console.error('verify-polar: lookup failed', r.status, r.data);
      return res.status(502).json({ verified: false, error: 'gateway_error' });
    }
    checkout = r.data;
    if (SETTLED.has(checkout?.status)) break;
    if (!IN_FLIGHT.has(checkout?.status)) break;   // open / expired / failed — no point waiting
    if (attempt < 3) await sleep(1200);
  }

  const status = checkout?.status;
  if (!SETTLED.has(status) && !IN_FLIGHT.has(status)) {
    console.warn('verify-polar: not paid', { checkoutId, status });
    return res.status(402).json({ verified: false, error: 'not_paid', status: status || 'unknown' });
  }

  /* ── Resolve the plan from the product id Polar reports. Metadata is
     a fallback only; the product is what was actually bought. ── */
  const fromProduct  = packageIdForProduct(checkout?.product_id);
  const fromMetadata = checkout?.metadata?.packageId;
  const packageId    = fromProduct || (CATALOG[fromMetadata] ? fromMetadata : null);

  if (!packageId) {
    console.error('verify-polar: could not resolve package', {
      checkoutId, productId: checkout?.product_id, metadataPackage: fromMetadata,
    });
    return res.status(500).json({ verified: false, error: 'unresolved_package' });
  }
  if (fromProduct && fromMetadata && fromProduct !== fromMetadata) {
    console.warn('verify-polar: metadata disagrees with product — trusting product', {
      checkoutId, fromProduct, fromMetadata,
    });
  }

  const plan          = CATALOG[packageId];
  const amount        = Number.isFinite(checkout?.total_amount) ? checkout.total_amount
                      : Number.isFinite(checkout?.amount)       ? checkout.amount
                      : plan.cents;
  const customerEmail = checkout?.customer_email || null;
  const customerName  = checkout?.customer_name  || '';
  const paymentRef    = checkout?.order_id || checkout?.id;

  const token = signToken({
    orderId:   checkoutId,
    paymentId: paymentRef,
    packageId,
    amount,
    rail:      'polar',
    exp:       Date.now() + TOKEN_TTL_MS,
  }, tokenSecret);

  /* Server copy of the Purchase for Meta (deduped with the browser
     Pixel by event id). Awaited briefly so serverless doesn't kill it. */
  await sendPurchase({
    req,
    eventId:    `purchase_${checkoutId}`,
    email:      customerEmail || body.email || '',
    name:       customerName,
    valueCents: Number.isFinite(checkout?.net_amount) ? checkout.net_amount : amount,
    currency:   checkout?.currency || 'usd',
    packageId,
    fbp:        typeof body.fbp === 'string' ? body.fbp : '',
    fbc:        typeof body.fbc === 'string' ? body.fbc : '',
    sourceUrl:  typeof body.sourceUrl === 'string' && body.sourceUrl.startsWith('https://') ? body.sourceUrl : undefined,
    ref:        typeof body.ref === 'string' ? body.ref : '',
  });

  /* Receipt plus the link back into the brief, so the customer can
     finish on another device or later. */
  if (customerEmail) {
    const site = siteUrl();
    sendEmail({
      to: customerEmail,
      template: 'paymentConfirmed',
      data: {
        name: String(customerName).split(' ')[0],
        packageId,
        amountCents: amount,
        paymentRef,
        intakeUrl: `${site}/?intake=${encodeURIComponent(token)}`,
      },
    }).catch(e => console.warn('receipt email:', e.message));
  }

  return res.status(200).json({
    verified:    true,
    intakeToken: token,
    packageId,
    amount,
    currency:    checkout?.currency || 'usd',
    email:       customerEmail,
    name:        customerName,
    reference:   paymentRef,
  });
}
