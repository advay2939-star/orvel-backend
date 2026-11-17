/* ═══════════════════════════════════════════════════════════════
   Shared Polar helpers.

   One place that knows: the API base, the auth header, which Polar
   product each Orvel plan maps to, and what each plan costs. The
   price here is the ONLY price that matters — the browser's copy is
   display-only, exactly as with the Razorpay path.
═══════════════════════════════════════════════════════════════ */

export const API_BASE = (process.env.POLAR_API_BASE || 'https://api.polar.sh').replace(/\/+$/, '');

/* Mirrors CATALOG in create-order.js. Kept separate on purpose: if
   one rail's prices ever move, the mismatch should be loud. */
export const CATALOG = {
  sleep:    { cents: 6900,  name: 'Sleep',    tracks: 2 },
  full:     { cents: 9900,  name: 'Full Day', tracks: 4 },
  complete: { cents: 14900, name: 'Complete', tracks: 5 },
};

/* packageId → Polar product UUID, from env so the ids never live in
   the repo and staging can point somewhere else. */
export function productIdFor(packageId) {
  const map = {
    sleep:    process.env.POLAR_PRODUCT_SLEEP,
    full:     process.env.POLAR_PRODUCT_FULL,
    complete: process.env.POLAR_PRODUCT_COMPLETE,
  };
  return map[packageId] || null;
}

/* Reverse lookup, so a checkout that comes back from Polar can be
   resolved to a plan without trusting its metadata. */
export function packageIdForProduct(productId) {
  if (!productId) return null;
  const pairs = [
    ['sleep',    process.env.POLAR_PRODUCT_SLEEP],
    ['full',     process.env.POLAR_PRODUCT_FULL],
    ['complete', process.env.POLAR_PRODUCT_COMPLETE],
  ];
  for (const [pkg, id] of pairs) if (id && id === productId) return pkg;
  return null;
}

export function authHeaders() {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) return null;
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type':  'application/json',
    'Accept':        'application/json',
  };
}

export async function polarFetch(path, init = {}) {
  const headers = authHeaders();
  if (!headers) throw new Error('POLAR_ACCESS_TOKEN missing');
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  return { ok: res.ok, status: res.status, data };
}

export function siteUrl() {
  return (process.env.SITE_URL || 'https://www.orvelsound.com').replace(/\/+$/, '');
}

export function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }
