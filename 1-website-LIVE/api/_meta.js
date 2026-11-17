/* ═══════════════════════════════════════════════════════════════
   Meta Conversions API — server copy of the Purchase event.

   The browser Pixel misses buyers with ad blockers, iOS tracking off
   or a closed tab. This sends the same Purchase from the server with
   the same event_id ('purchase_<checkoutId>'), so Meta keeps one copy.
   Never throws; a tracking failure must never touch the order.

   Env: META_CAPI_TOKEN (required to send), META_PIXEL_ID (optional,
   defaults to the Orvel Pixel), META_TEST_EVENT_CODE (optional, only
   while testing in Events Manager).
═══════════════════════════════════════════════════════════════ */
import crypto from 'node:crypto';

const DEFAULT_PIXEL = '4421864751398564';
const GRAPH = 'https://graph.facebook.com/v21.0';

const sha = v => crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');

export async function sendPurchase({ req, eventId, email, name, valueCents, currency, packageId, fbp, fbc, sourceUrl, ref }) {
  const token = process.env.META_CAPI_TOKEN;
  const pixel = process.env.META_PIXEL_ID || DEFAULT_PIXEL;
  if (!token) return { sent: false, reason: 'no_token' };

  const fwd = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  const user_data = {
    client_ip_address: fwd || req?.socket?.remoteAddress || undefined,
    client_user_agent: req?.headers?.['user-agent'] || undefined,
  };
  if (email) user_data.em = [sha(email)];
  const fn = String(name || '').trim().split(/\s+/)[0];
  if (fn) user_data.fn = [sha(fn)];
  if (fbp && /^fb\.\d\.\d+\.\d+/.test(fbp)) user_data.fbp = fbp;
  if (fbc && /^fb\.\d\.\d+\./.test(fbc))    user_data.fbc = fbc;

  const payload = {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: sourceUrl || 'https://www.orvelsound.com/',
      user_data,
      custom_data: {
        value: Math.round(valueCents) / 100,
        currency: String(currency || 'usd').toUpperCase(),
        content_ids: [packageId],
        content_type: 'product',
        num_items: 1,
        ...(ref ? { ref: String(ref).slice(0, 40) } : {}),
      },
    }],
  };
  if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE;

  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 2500);
    const r = await fetch(`${GRAPH}/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: ctl.signal,
    });
    clearTimeout(t);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { console.warn('meta capi:', r.status, JSON.stringify(d).slice(0, 300)); return { sent: false, status: r.status }; }
    return { sent: true, received: d.events_received };
  } catch (e) {
    console.warn('meta capi error:', e.message);
    return { sent: false, reason: e.message };
  }
}
