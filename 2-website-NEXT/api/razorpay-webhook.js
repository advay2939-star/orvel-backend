/* ═══════════════════════════════════════════════════════════════
   POST /api/razorpay-webhook

   Razorpay calls this directly, server to server, when a payment is
   captured. It does not depend on the customer's browser staying
   open — which is the whole point. If someone pays at 3am on a phone
   and the tab dies during redirect, this still fires.

   Setup (once): Razorpay Dashboard -> Settings -> Webhooks -> Add
     URL     https://www.orvelsound.com/api/razorpay-webhook
     Secret  same value as RAZORPAY_WEBHOOK_SECRET in Vercel
     Events  payment.captured
═══════════════════════════════════════════════════════════════ */
import crypto from 'crypto';
import { sendEmail } from './_email.js';
import { signToken } from './verify-payment.js';
import { isPackage } from './_catalog.js';
import { claimEmail, insert, supabaseReady } from './_db.js';

/* Razorpay signs the RAW body. Next/Vercel would otherwise parse it
   into an object and the signature would never match. */
export const config = { api: { bodyParser: false } };

const INTAKE_TTL_MS = 1000 * 60 * 60 * 24 * 14;   // 14 days to finish the brief

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const secret      = process.env.RAZORPAY_WEBHOOK_SECRET;
  const tokenSecret = process.env.INTAKE_TOKEN_SECRET;
  if (!secret || !tokenSecret) {
    console.error('webhook: env vars missing');
    return res.status(500).json({ error: 'not_configured' });
  }

  let raw;
  try { raw = await rawBody(req); }
  catch { return res.status(400).json({ error: 'unreadable_body' }); }

  /* ── verify it really came from Razorpay ── */
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const given    = String(req.headers['x-razorpay-signature'] || '');
  const a = Buffer.from(given), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    console.warn('webhook: BAD SIGNATURE — ignoring');
    return res.status(400).json({ error: 'bad_signature' });
  }

  let event;
  try { event = JSON.parse(raw.toString('utf8')); }
  catch { return res.status(400).json({ error: 'bad_json' }); }

  /* Always 200 from here on. A non-2xx makes Razorpay retry, and a
     retry storm caused by our own bug helps nobody. Failures are
     logged and swallowed. */
  try {
    if (event.event === 'payment.captured') {
      await onPaymentCaptured(event, tokenSecret);
    }
  } catch (err) {
    console.error('webhook handler error:', err);
  }

  return res.status(200).json({ received: true });
}

async function onPaymentCaptured(event, tokenSecret) {
  const payment = event?.payload?.payment?.entity;
  if (!payment) return;

  const paymentId = payment.id;
  const orderId   = payment.order_id;
  const notes     = payment.notes || {};

  const packageId = isPackage(notes.packageId) ? notes.packageId : null;
  const email     = notes.customer_email || payment.email || null;
  const name      = notes.customer_name  || '';

  if (!packageId || !email) {
    console.warn('webhook: missing package or email', { paymentId, packageId, email });
    return;
  }

  /* Record the order first so the studio has a row even if email
     delivery later fails. Duplicate order_ref is fine — the unique
     index rejects it and we move on. */
  if (supabaseReady()) {
    const r = await insert('orders', {
      order_ref:    orderId,
      payment_ref:  paymentId,
      package_id:   packageId,
      amount_cents: payment.amount,
      currency:     payment.currency,
      email, full_name: name,
      status:       'paid',
      paid_at:      new Date().toISOString(),
    });
    if (!r.ok && r.status !== 409) {
      console.warn('webhook: order insert', r.status, await r.text());
    }
  }

  /* One receipt per payment, ever. */
  if (!(await claimEmail('payment_confirmed', paymentId))) {
    console.log('webhook: receipt already sent for', paymentId);
    return;
  }

  const token = signToken(
    { orderId, paymentId, packageId, amount: payment.amount,
      exp: Date.now() + INTAKE_TTL_MS },
    tokenSecret,
  );

  const site = process.env.SITE_URL || 'https://www.orvelsound.com';
  await sendEmail({
    to: email,
    template: 'paymentConfirmed',
    data: {
      name: name.split(' ')[0],
      packageId,
      amountCents: payment.amount,
      paymentRef: paymentId,
      intakeUrl: `${site}/?intake=${encodeURIComponent(token)}`,
    },
  });
}
