/* ═══════════════════════════════════════════════════════════════
   POST /api/create-polar-checkout

   Creates a Polar Checkout Session and hands the browser a URL the
   embedded overlay can open. The customer never leaves orvelsound.com.

   The price is decided here, from packageId alone, and is then
   checked against what Polar actually has on the product. If the two
   disagree the request is refused rather than quietly charging the
   wrong amount — that is the failure a bad product-id mapping causes,
   and it must never reach a customer.
═══════════════════════════════════════════════════════════════ */
import {
  CATALOG, productIdFor, polarFetch, siteUrl, safeJson,
} from './_polar.js';

function bad(res, status, code, msg) {
  return res.status(status).json({ error: code, message: msg });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return bad(res, 405, 'method_not_allowed', 'Use POST.');
  }

  if (!process.env.POLAR_ACCESS_TOKEN) {
    console.error('create-polar-checkout: POLAR_ACCESS_TOKEN missing');
    return bad(res, 500, 'not_configured', 'Payments are not configured on this deployment.');
  }

  const body = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
  const { packageId, customer, subscription } = body;

  const plan = CATALOG[packageId];
  if (!plan) return bad(res, 400, 'unknown_package', 'Unknown package.');

  const productId = productIdFor(packageId);
  if (!productId) {
    console.error('create-polar-checkout: no product id configured for', packageId);
    return bad(res, 500, 'not_configured', 'That package is not connected to a product yet.');
  }

  /* Log-only comparison, same posture as create-order.js. */
  const claimed = Number(body.displayAmountCents);
  if (Number.isFinite(claimed) && claimed !== plan.cents) {
    console.warn('create-polar-checkout: browser amount mismatch', {
      packageId, claimed, authoritative: plan.cents,
    });
  }

  const email = String(customer?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad(res, 400, 'invalid_email', 'A valid email is required.');
  }
  const name = String(customer?.name || '').trim().slice(0, 120);

  /* ── Guard the mapping. A product id pointing at the wrong tier is
     the one bug here that costs a customer money, so verify the
     amount Polar holds before opening any checkout. ── */
  try {
    const prod = await polarFetch(`/v1/products/${encodeURIComponent(productId)}`);
    if (!prod.ok) {
      console.error('create-polar-checkout: product lookup failed', prod.status, prod.data);
      return bad(res, 502, 'gateway_error', 'Could not reach the payment provider.');
    }
    const prices = Array.isArray(prod.data?.prices) ? prod.data.prices : [];
    const live = prices.find(p => !p.is_archived && p.amount_type === 'fixed');
    if (!live) {
      console.error('create-polar-checkout: no fixed price on product', productId);
      return bad(res, 500, 'price_unavailable', 'That package has no active price.');
    }
    if (live.price_amount !== plan.cents) {
      console.error('create-polar-checkout: PRICE MISMATCH — refusing', {
        packageId, productId, polarCents: live.price_amount, expectedCents: plan.cents,
      });
      return bad(res, 500, 'price_mismatch',
        'This package is misconfigured and checkout has been stopped. Nothing was charged.');
    }
  } catch (err) {
    console.error('create-polar-checkout: product check threw', err);
    return bad(res, 502, 'gateway_error', 'Could not reach the payment provider.');
  }

  const site = siteUrl();

  try {
    const created = await polarFetch('/v1/checkouts/', {
      method: 'POST',
      body: JSON.stringify({
        products: [productId],
        customer_email: email,
        customer_name:  name || undefined,
        /* embed_origin lets the overlay run on our own domain;
           success_url is only used if the customer completes on
           Polar's hosted page instead (email link, reopened tab). */
        embed_origin: site,
        success_url:  `${site}/?polar_checkout={CHECKOUT_ID}`,
        allow_discount_codes: true,
        metadata: Object.fromEntries(Object.entries({
          packageId,
          plan_name:        plan.name,
          tracks:           String(plan.tracks),
          customer_phone:   String(customer?.phone   || '').slice(0, 40),
          customer_country: String(customer?.country || '').slice(0, 80),
          refresh_optin:    subscription ? 'yes' : 'no',
          landing_ref:      String(body.meta?.ref || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40),
        }).filter(([, v]) => v !== '')),
      }),
    });

    if (!created.ok || !created.data?.url) {
      console.error('create-polar-checkout: polar rejected', created.status, created.data);
      return bad(res, 502, 'gateway_error', 'The payment provider rejected the order.');
    }

    return res.status(200).json({
      checkoutId: created.data.id,
      url:        created.data.url,
      amount:     created.data.amount ?? plan.cents,
      currency:   created.data.currency || 'usd',
    });
  } catch (err) {
    console.error('create-polar-checkout: exception', err);
    return bad(res, 500, 'server_error', 'Could not start the checkout.');
  }
}
