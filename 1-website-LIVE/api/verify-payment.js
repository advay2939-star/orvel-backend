/* ═══════════════════════════════════════════════════════════════
   POST /api/verify-payment
   Verifies Razorpay's HMAC signature and, only on success, mints a
   short-lived signed intake token. That token is what /api/submit-brief
   demands. A browser cannot forge one, so it cannot forge a brief.
═══════════════════════════════════════════════════════════════ */
import crypto from 'crypto';
import { sendEmail } from './_email.js';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 6;   // 6 hours to finish the questionnaire

export function signToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig  = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token, secret) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(sig || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); }
  catch { return null; }
  if (!payload.exp || Date.now() > payload.exp) return null;
  return payload;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const keySecret   = process.env.RAZORPAY_KEY_SECRET;
  const tokenSecret = process.env.INTAKE_TOKEN_SECRET;
  if (!keySecret || !tokenSecret) {
    console.error('verify-payment: env vars missing');
    return res.status(500).json({ error: 'not_configured' });
  }

  const body = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
  const { orderId, paymentId, signature } = body;

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ error: 'missing_fields', verified: false });
  }

  /* Razorpay's documented check: HMAC-SHA256 of "order_id|payment_id" */
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const a = Buffer.from(String(signature));
  const b = Buffer.from(expected);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!ok) {
    console.warn('verify-payment: BAD SIGNATURE', { orderId, paymentId });
    return res.status(400).json({ verified: false, error: 'bad_signature' });
  }

  /* Re-fetch the order from Razorpay so the package comes from the
     gateway's record, not from anything the browser told us. */
  let packageId = null, amount = null, customerEmail = null, customerName = null;
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const auth  = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const r = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (r.ok) {
      const order = await r.json();
      packageId = order?.notes?.packageId || null;
      customerEmail = order?.notes?.customer_email || null;
      customerName  = order?.notes?.customer_name  || null;
      amount    = order?.amount ?? null;
      if (order?.status === 'paid' || order?.amount_paid > 0) { /* good */ }
    }
  } catch (err) {
    console.warn('verify-payment: order lookup failed', err.message);
  }

  const token = signToken({
    orderId, paymentId, packageId, amount,
    exp: Date.now() + TOKEN_TTL_MS,
  }, tokenSecret);

  /* Receipt + the link back into the questionnaire. The token is in
     the URL so the customer can finish the brief later, on any device,
     without us inventing an account system. */
  if (customerEmail) {
    const site = process.env.SITE_URL || 'https://www.orvelsound.com';
    sendEmail({
      to: customerEmail,
      template: 'paymentConfirmed',
      data: {
        name: (customerName || '').split(' ')[0],
        packageId,
        amountCents: amount,
        paymentRef: paymentId,
        intakeUrl: `${site}/?intake=${encodeURIComponent(token)}`,
      },
    }).catch(e => console.warn('receipt email:', e.message));
  }

  return res.status(200).json({ verified: true, intakeToken: token, packageId });
}

function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }
