/* ═══════════════════════════════════════════════════════════════
   GET /api/cron-intake-reminder

   Runs daily (see vercel.json "crons"). Finds paid orders whose
   brief never arrived and sends exactly one nudge each.

   Deliberately conservative:
     - waits 24h before nudging, so nobody is chased mid-checkout
     - stops after 14 days; past that the intake token has expired
       and a reminder would only lead to a dead link
     - one reminder per order, enforced by email_log
═══════════════════════════════════════════════════════════════ */
import { sendEmail } from './_email.js';
import { signToken } from './verify-payment.js';
import { claimEmail, select, supabaseReady } from './_db.js';

const WAIT_HOURS = 24;
const GIVE_UP_DAYS = 14;
const INTAKE_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export default async function handler(req, res) {
  /* Vercel Cron sends a bearer token. Reject anything else so the
     endpoint can't be used to spam customers. */
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = String(req.headers.authorization || '');
    if (auth !== `Bearer ${secret}`) {
      return res.status(401).json({ error: 'unauthorized' });
    }
  }

  if (!supabaseReady()) {
    return res.status(500).json({ error: 'not_configured' });
  }

  const tokenSecret = process.env.INTAKE_TOKEN_SECRET;
  const site = process.env.SITE_URL || 'https://www.orvelsound.com';

  const now = Date.now();
  const after  = new Date(now - GIVE_UP_DAYS * 864e5).toISOString();
  const before = new Date(now - WAIT_HOURS * 36e5).toISOString();

  /* Paid, but no brief submitted yet. */
  const orders = await select(
    'orders',
    `status=eq.paid&brief_received=is.false` +
    `&paid_at=gte.${after}&paid_at=lte.${before}` +
    `&select=order_ref,payment_ref,package_id,email,full_name,amount_cents&limit=200`,
  );

  let sent = 0, skipped = 0;

  for (const o of orders) {
    if (!o.email) { skipped++; continue; }
    if (!(await claimEmail('intake_reminder', o.payment_ref))) { skipped++; continue; }

    const token = signToken(
      { orderId: o.order_ref, paymentId: o.payment_ref, packageId: o.package_id,
        amount: o.amount_cents, exp: now + INTAKE_TTL_MS },
      tokenSecret,
    );

    const r = await sendEmail({
      to: o.email,
      template: 'intakeReminder',
      data: {
        name: (o.full_name || '').split(' ')[0],
        packageId: o.package_id,
        intakeUrl: `${site}/?intake=${encodeURIComponent(token)}`,
      },
    });
    if (r.ok) sent++;
  }

  console.log(`cron-intake-reminder: ${orders.length} candidates, ${sent} sent, ${skipped} skipped`);
  return res.status(200).json({ candidates: orders.length, sent, skipped });
}
