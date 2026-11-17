/* ═══════════════════════════════════════════════════════════════
   Orvel — server-side Supabase access.

   Uses the SERVICE ROLE key, which bypasses RLS. This module must
   never be imported by anything that runs in the browser.

   Also holds the email de-duplication guard: Razorpay can and does
   deliver the same webhook more than once, so every send is claimed
   in `email_log` first. A unique index makes the claim atomic — if
   two invocations race, exactly one wins and the other backs off.
═══════════════════════════════════════════════════════════════ */

const url = () => process.env.SUPABASE_URL;
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

export function supabaseReady() { return Boolean(url() && key()); }

async function sb(path, init = {}) {
  const res = await fetch(`${url()}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key(),
      Authorization: `Bearer ${key()}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  return res;
}

export async function insert(table, rows, { returning = 'minimal' } = {}) {
  const res = await sb(table, {
    method: 'POST',
    headers: { Prefer: `return=${returning}` },
    body: JSON.stringify(Array.isArray(rows) ? rows : [rows]),
  });
  return res;
}

export async function select(table, query) {
  const res = await sb(`${table}?${query}`);
  if (!res.ok) return [];
  return res.json();
}

export async function update(table, query, patch) {
  return sb(`${table}?${query}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  });
}

/* ── Idempotency ─────────────────────────────────────────────
   Returns true if THIS invocation owns the send. A 409 from the
   unique index means someone else already claimed it. */
export async function claimEmail(kind, ref) {
  if (!supabaseReady()) return true;          // no store: fail open, still send
  const res = await insert('email_log', { kind, ref, sent_at: new Date().toISOString() });
  if (res.status === 409) return false;       // already sent
  if (!res.ok) {
    console.warn('claimEmail: unexpected', res.status, await res.text());
    return true;                              // never block a receipt on bookkeeping
  }
  return true;
}
