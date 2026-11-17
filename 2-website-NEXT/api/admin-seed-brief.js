/* ═══════════════════════════════════════════════════════════════
   POST /api/admin-seed-brief
   Studio-only. Inserts a synthetic brief so the console can be used
   and tested before Razorpay is live. Marked is_test = true.

   Auth: the caller's Supabase access token is verified against the
   admins table. Not a password, not a shared secret.
═══════════════════════════════════════════════════════════════ */

const SAMPLE = {
  full_name: 'Test Customer',
  phone_number: '+91 90000 00000',
  country: 'India',
  shift_pattern: 'Rotating shifts',
  playback: 'Over-ear headphones',
  wake_sensitivity: 'Fairly light',
  masking_targets: ['Traffic outside', 'Neighbours through the wall'],
  sound_families: ['Deep water', 'Low wind'],
  aversions: ['Rain'],
  texture: 'Smooth and continuous',
  tone: 'Dark',
  depth: 'Low and wide',
  character: 'Still',
  calm_place: 'A harbour at night, engine room hum below deck',
  system_name: 'Undertow',
};

const PLAN_TRACKS = {
  sleep:    ['winddown', 'sleep'],
  full:     ['morning', 'focus', 'winddown', 'sleep'],
  complete: ['morning', 'focus', 'afternoon', 'winddown', 'sleep'],
};

const TRACKS = {
  morning:   { name: 'Morning',         carrier: 250, beat: 40,  band: 'gamma', lufs: -16 },
  focus:     { name: 'Focus',           carrier: 300, beat: 14,  band: 'beta',  lufs: -18 },
  afternoon: { name: 'Afternoon Reset', carrier: 300, beat: 14,  band: 'beta',  lufs: -18 },
  winddown:  { name: 'Wind-down',       carrier: 400, beat: 6,   band: 'theta', lufs: -20 },
  sleep:     { name: 'Sleep',           carrier: 400, beat: 2.5, band: 'delta', lufs: -18 },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const supaUrl    = process.env.SUPABASE_URL;
  const anonKey    = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !anonKey || !serviceKey) {
    return res.status(500).json({ error: 'not_configured' });
  }

  /* ── verify the caller is studio ── */
  const bearer = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!bearer) return res.status(401).json({ error: 'no_token' });

  const who = await fetch(`${supaUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${bearer}` },
  });
  if (!who.ok) return res.status(401).json({ error: 'bad_token' });
  const user = await who.json();
  if (!user?.email) return res.status(401).json({ error: 'bad_token' });

  const check = await fetch(
    `${supaUrl}/rest/v1/admins?email=eq.${encodeURIComponent(user.email.toLowerCase())}&select=email`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
  );
  const rows = check.ok ? await check.json() : [];
  if (!rows.length) return res.status(403).json({ error: 'not_studio' });

  /* ── build the row ── */
  const body = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
  const packageId = PLAN_TRACKS[body.packageId] ? body.packageId : 'full';
  const speaker = false;

  const tracks = PLAN_TRACKS[packageId].map((tid) => {
    const t = TRACKS[tid];
    return {
      track: tid,
      name: t.name,
      dsp: {
        binaural: !speaker,
        carrierHz: t.carrier,
        beatHz: t.beat,
        band: t.band,
        targetLufs: t.lufs,
        maskingFloorDb: tid === 'sleep' ? -24 : -28,
        maskingSpectrum: ['low-frequency broadband, 60–400 Hz weighted',
                          'mid-band speech range, 300 Hz–3 kHz'],
        note: 'Binaural layer active — locked to goal, verified by FFT gate.',
      },
      flowPrompt:
        `Ambient ${t.name.toLowerCase()} bed, continuous, no melody, no pitched motif, ` +
        `no discernible key. Sound world: deep water and low wind. Texture: smooth and ` +
        `continuous. Tonal colour: dark. Register: low and wide. Character: still. ` +
        `Setting: a harbour at night, engine room hum below deck. No rain.`,
      timing: 'It changes every week',
      intent: 'Staying asleep through noise',
    };
  });

  const row = {
    ...SAMPLE,
    email: user.email,
    package_id: packageId,
    payment_ref: 'test_' + Date.now().toString(36),
    order_ref: 'order_test_' + Date.now().toString(36),
    amount_cents: null,
    subscribed_refresh: false,
    answers_json: { _note: 'seeded test brief, not a real customer' },
    production_brief: {
      plan: packageId,
      playback: SAMPLE.playback,
      binauralEligible: true,
      maskingLevel: 'firm',
      maskingTargets: SAMPLE.masking_targets,
      schedule: SAMPLE.shift_pattern,
      systemName: SAMPLE.system_name,
      tracks,
    },
    is_test: true,
    status: 'new',
    submitted_at: new Date().toISOString(),
  };

  const ins = await fetch(`${supaUrl}/rest/v1/shift_track_submissions`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify([row]),
  });

  if (!ins.ok) {
    const detail = await ins.text();
    console.error('admin-seed-brief: insert failed', ins.status, detail);
    return res.status(502).json({ error: 'insert_failed', detail });
  }

  const [created] = await ins.json();
  return res.status(200).json({ ok: true, id: created?.id });
}

function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }
