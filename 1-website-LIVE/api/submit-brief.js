/* ═══════════════════════════════════════════════════════════════
   POST /api/submit-brief
   The only way a brief reaches the database. Requires the signed
   intake token minted by /api/verify-payment, so an unpaid browser
   has nothing valid to send. Writes with the Supabase SERVICE ROLE
   key, which never touches the client.

   Pair this with RLS on shift_track_submissions:
     alter table shift_track_submissions enable row level security;
     -- no insert/select policy for anon or authenticated.
     -- the service role bypasses RLS, so only this function writes.
═══════════════════════════════════════════════════════════════ */
import { verifyToken } from './verify-payment.js';
import { sendEmail } from './_email.js';

const PACKAGE_IDS = new Set(['sleep', 'full', 'complete']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const tokenSecret = process.env.INTAKE_TOKEN_SECRET;
  const supaUrl     = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!tokenSecret || !supaUrl || !serviceKey) {
    console.error('submit-brief: env vars missing');
    return res.status(500).json({ ok: false, error: 'not_configured' });
  }

  const body = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
  const { intakeToken, brief } = body;

  const claim = verifyToken(intakeToken, tokenSecret);
  if (!claim) {
    console.warn('submit-brief: rejected — no valid intake token');
    return res.status(401).json({ ok: false, error: 'payment_not_verified' });
  }

  if (!brief || typeof brief !== 'object') {
    return res.status(400).json({ ok: false, error: 'missing_brief' });
  }

  /* package_id and payment_ref come from the TOKEN, not the body.
     The browser cannot upgrade itself from Sleep to Complete. */
  const packageId = PACKAGE_IDS.has(claim.packageId) ? claim.packageId : null;
  if (!packageId) {
    return res.status(400).json({ ok: false, error: 'unresolved_package' });
  }

  const row = {
    ...sanitizeBrief(brief),
    package_id:   packageId,
    payment_ref:  claim.paymentId,
    order_ref:    claim.orderId,
    amount_cents: claim.amount ?? null,
    submitted_at: new Date().toISOString(),
  };

  try {
    const r = await fetch(`${supaUrl}/rest/v1/shift_track_submissions`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify([row]),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('submit-brief: supabase insert failed', r.status, detail);
      return res.status(502).json({ ok: false, error: 'insert_failed' });
    }

    /* Studio alert — fire and forget, never blocks the customer. */
    notifyStudio(row).catch(e => console.warn('studio alert:', e.message));
    confirmToCustomer(row).catch(e => console.warn('customer confirm:', e.message));

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('submit-brief: exception', err);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
}

/* Copy only known fields. Prevents a crafted payload from writing
   into columns it shouldn't (e.g. a fulfilment or refund flag). */
function sanitizeBrief(b) {
  const str  = v => (typeof v === 'string' ? v.slice(0, 2000) : null);
  const arr  = v => (Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(0, 40).map(x => x.slice(0, 200)) : []);
  return {
    full_name:        str(b.full_name),
    email:            str(b.email),
    phone_number:     str(b.phone_number),
    country:          str(b.country),
    shift_pattern:    str(b.shift_pattern),
    playback:         str(b.playback),
    wake_sensitivity: str(b.wake_sensitivity),
    masking_targets:  arr(b.masking_targets),
    sound_families:   arr(b.sound_families),
    aversions:        arr(b.aversions),
    texture:          str(b.texture),
    tone:             str(b.tone),
    depth:            str(b.depth),
    character:        str(b.character),
    calm_place:       str(b.calm_place),
    system_name:      str(b.system_name),
    answers_json:     (b.answers_json && typeof b.answers_json === 'object') ? b.answers_json : {},
    production_brief: (b.production_brief && typeof b.production_brief === 'object') ? b.production_brief : {},
    subscribed_refresh: !!b.subscribed_refresh,
  };
}

async function notifyStudio(row) {
  const to = process.env.STUDIO_EMAIL;
  if (!to) return;
  await sendEmail({
    to,
    template: 'studioNewBrief',
    data: {
      fullName:  row.full_name,
      email:     row.email,
      packageId: row.package_id,
      paymentRef: row.payment_ref,
      shiftPattern: row.shift_pattern,
      playback:     row.playback,
      maskingTargets: row.masking_targets,
      wakeSensitivity: row.wake_sensitivity,
      subscribedRefresh: row.subscribed_refresh,
    },
  });
}

const TRACK_COUNT = { sleep: 2, full: 4, complete: 5 };

async function confirmToCustomer(row) {
  if (!row.email) return;
  await sendEmail({
    to: row.email,
    template: 'briefReceived',
    data: {
      name: (row.full_name || '').split(' ')[0],
      packageId: row.package_id,
      shiftPattern: row.shift_pattern,
      playback: row.playback,
      trackCount: TRACK_COUNT[row.package_id],
    },
  });
}

function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }
