/* ═══════════════════════════════════════════════════════════════
   POST /api/create-order
   Creates a real Razorpay order. The PRICE IS DECIDED HERE, from
   packageId alone. Anything the browser sends about money is read
   for logging and then ignored.
═══════════════════════════════════════════════════════════════ */

/* The only source of truth for price. Mirrors PLANS in the page,
   but the page's copy is display-only. */
const CATALOG = {
  sleep:    { cents: 6900,  name: 'Sleep',    tracks: 2 },
  full:     { cents: 9900,  name: 'Full Day', tracks: 4 },
  complete: { cents: 14900, name: 'Complete', tracks: 5 },
};

const ALLOWED_CURRENCIES = new Set(['USD', 'INR']);

function bad(res, status, code, msg) {
  return res.status(status).json({ error: code, message: msg });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return bad(res, 405, 'method_not_allowed', 'Use POST.');
  }

  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    console.error('create-order: Razorpay env vars missing');
    return bad(res, 500, 'not_configured', 'Payments are not configured on this deployment.');
  }

  const body = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
  const { packageId, currency, customer, subscription } = body;

  /* ── price from packageId, never from the browser ── */
  const plan = CATALOG[packageId];
  if (!plan) return bad(res, 400, 'unknown_package', 'Unknown package.');

  const cur = ALLOWED_CURRENCIES.has(currency) ? currency : 'USD';

  /* Log-only comparison. If these ever diverge it means the page is
     stale or someone is probing — worth knowing, never authoritative. */
  const claimed = Number(body.displayAmountCents);
  if (Number.isFinite(claimed) && claimed !== plan.cents) {
    console.warn('create-order: browser amount mismatch', {
      packageId, claimed, authoritative: plan.cents,
    });
  }

  const email = String(customer?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad(res, 400, 'invalid_email', 'A valid email is required.');
  }

  const receipt = 'orvel_' + Date.now().toString(36) + '_' +
                  Math.random().toString(36).slice(2, 8);

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const rz = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount:   plan.cents,          // authoritative
        currency: cur,
        receipt,
        notes: {
          packageId,
          plan_name:    plan.name,
          tracks:       String(plan.tracks),
          customer_name:  String(customer?.name  || '').slice(0, 120),
          customer_email: email,
          customer_phone: String(customer?.phone || '').slice(0, 40),
          customer_country: String(customer?.country || '').slice(0, 80),
          refresh_optin: subscription ? 'yes' : 'no',
        },
      }),
    });

    const data = await rz.json();
    if (!rz.ok) {
      console.error('create-order: razorpay rejected', rz.status, data);
      return bad(res, 502, 'gateway_error', 'The payment provider rejected the order.');
    }

    return res.status(200).json({
      orderId:  data.id,
      amount:   data.amount,
      currency: data.currency,
      receipt,
    });
  } catch (err) {
    console.error('create-order: exception', err);
    return bad(res, 500, 'server_error', 'Could not create the order.');
  }
}

function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }
