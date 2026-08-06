/* ============================================================
   ORVEL — BACKEND
   Express + Supabase (service_role) + Razorpay + Resend
   ============================================================ */
'use strict';

const express  = require('express');
const crypto   = require('crypto');
const Razorpay = require('razorpay');
const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');
const { generateTrackSpecs, TIER_TRACKS, TRACK_SLOTS } = require('./prompt_engine');
const T = require('./emails');

const {
  PORT = 8080,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
  RESEND_API_KEY,
  FROM_EMAIL   = 'Orvel <orders@orvel.co>',
  ADMIN_EMAIL  = 'advay2939@gmail.com',
  SITE_URL     = 'https://orvel.co',
} = process.env;

const supa   = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const rzp    = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
const resend = new Resend(RESEND_API_KEY);

const app = express();

/* Razorpay webhook needs the RAW body for signature verification.
   Mount it BEFORE express.json(). */
app.use('/api/razorpay-webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', SITE_URL);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/* ---------- TIERS (mirror of the frontend, server is authoritative) ---------- */
const TIERS = {
  sleep: { id:'sleep', name:'Sleep Track',        trackCount:1, listCents:3900  },
  core:  { id:'core',  name:'Sleep + Wind-down',  trackCount:2, listCents:6500  },
  full:  { id:'full',  name:'Full Day System',    trackCount:4, listCents:12900 },
};
const LAUNCH = { ENABLED:true, ENDS_AT:'2026-07-22T23:59:59+05:30', DISCOUNT_PCT:50, DEPOSIT_PCT:50 };
const launchActive = () => LAUNCH.ENABLED && Date.now() < new Date(LAUNCH.ENDS_AT).getTime();

function priceTier(tierId, discountCents = 0) {
  const t = TIERS[tierId];
  if (!t) throw new Error('unknown tier');
  const on      = launchActive();
  const launch  = on ? Math.round(t.listCents * (100 - LAUNCH.DISCOUNT_PCT) / 100) : t.listCents;
  const after   = Math.max(100, launch - discountCents);
  const deposit = on ? Math.round(after * LAUNCH.DEPOSIT_PCT / 100) : after;
  return { ...t, launchCents: after, depositCents: deposit, balanceCents: after - deposit };
}

/* ---------- email helper with idempotency ---------- */
async function sendEmail({ type, to, tpl, leadId = null, orderId = null }) {
  if (orderId) {
    const { data: prior } = await supa.from('email_log')
      .select('id').eq('order_id', orderId).eq('email_type', type).maybeSingle();
    if (prior) { console.log(`[email] skip duplicate ${type} for order ${orderId}`); return null; }
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL, to: [to], subject: tpl.subject, html: tpl.html
    });
    if (error) throw new Error(error.message);
    await supa.from('email_log').insert({
      lead_id: leadId, order_id: orderId, email_type: type,
      to_email: to, subject: tpl.subject, resend_id: data && data.id, status: 'sent'
    });
    console.log(`[email] sent ${type} → ${to}`);
    return data;
  } catch (e) {
    await supa.from('email_log').insert({
      lead_id: leadId, order_id: orderId, email_type: type,
      to_email: to, subject: tpl.subject, status: 'failed', error: String(e.message)
    });
    console.error(`[email] FAILED ${type} → ${to}:`, e.message);
    return null;
  }
}

/* ============================================================
   1. LEAD CAPTURE — before the questionnaire
   ============================================================ */
app.post('/api/lead', async (req, res) => {
  try {
    const { fullName, email, phone, countryDial, countryFlag, countryName } = req.body || {};
    if (!fullName || !email || !phone) return res.status(400).json({ error: 'missing fields' });

    const { data: existing } = await supa.from('leads')
      .select('*').eq('email', email.toLowerCase().trim())
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (existing) {
      await supa.from('leads').update({
        full_name: fullName, phone,
        country_dial: countryDial || '+1',
        country_flag: countryFlag || '🇺🇸',
        country_name: countryName || 'United States'
      }).eq('id', existing.id);
      return res.json({ leadId: existing.id, resumeToken: existing.resume_token });
    }

    const { data, error } = await supa.from('leads').insert({
      full_name: fullName,
      email: email.toLowerCase().trim(),
      phone,
      country_dial: countryDial || '+1',
      country_flag: countryFlag || '🇺🇸',
      country_name: countryName || 'United States',
      stage: 'lead'
    }).select().single();
    if (error) throw error;

    res.json({ leadId: data.id, resumeToken: data.resume_token });
  } catch (e) {
    console.error('[lead]', e.message);
    res.status(500).json({ error: 'lead_failed' });
  }
});

/* ============================================================
   2. QUESTIONNAIRE
   ============================================================ */
app.post('/api/questionnaire', async (req, res) => {
  try {
    const { leadId, shift, disruptors, timing, soundscape, raw } = req.body || {};
    if (!leadId) return res.status(400).json({ error: 'missing leadId' });

    const { error } = await supa.from('questionnaire_responses').insert({
      lead_id: leadId,
      shift: shift || null,
      disruptors: Array.isArray(disruptors) ? disruptors : [],
      timing: timing || null,
      soundscape: Array.isArray(soundscape) ? soundscape : [],
      raw_answers: raw || {}
    });
    if (error) throw error;

    await supa.from('leads').update({ stage: 'questionnaire_complete' }).eq('id', leadId);
    res.json({ ok: true });
  } catch (e) {
    console.error('[questionnaire]', e.message);
    res.status(500).json({ error: 'questionnaire_failed' });
  }
});

/* ============================================================
   3. CREATE RAZORPAY ORDER
   ============================================================ */
app.post('/api/create-order', async (req, res) => {
  try {
    const { leadId, tierId, discountCode } = req.body || {};
    if (!TIERS[tierId]) return res.status(400).json({ error: 'unknown tier' });

    let discountCents = 0;
    if (discountCode) {
      const { data: l } = await supa.from('leads')
        .select('discount_code').eq('id', leadId).maybeSingle();
      if (l && l.discount_code === discountCode) discountCents = 1000; // $10
    }

    const priced = priceTier(tierId, discountCents);

    const rzpOrder = await rzp.orders.create({
      amount: priced.depositCents,      // smallest currency unit
      currency: 'USD',
      receipt: `orvel_${Date.now()}`,
      notes: { leadId: leadId || '', tierId }
    });

    const { data: order, error } = await supa.from('orders').insert({
      lead_id: leadId,
      tier_id: tierId,
      tier_name: priced.name,
      track_count: priced.trackCount,
      currency: 'USD',
      list_cents: priced.listCents,
      launch_cents: priced.launchCents,
      amount_paid_cents: 0,
      balance_cents: priced.balanceCents,
      discount_code: discountCents ? discountCode : null,
      status: 'created',
      razorpay_order_id: rzpOrder.id
    }).select().single();
    if (error) throw error;

    if (leadId) await supa.from('leads').update({ stage: 'checkout_opened' }).eq('id', leadId);

    res.json({
      orderId: rzpOrder.id,
      internalOrderId: order.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: RAZORPAY_KEY_ID
    });
  } catch (e) {
    console.error('[create-order]', e.message);
    res.status(500).json({ error: 'order_failed', detail: e.message });
  }
});

/* ============================================================
   4. RAZORPAY WEBHOOK — the source of truth for payment
   ============================================================ */
app.post('/api/razorpay-webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const expected  = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
                            .update(req.body).digest('hex');
    if (signature !== expected) {
      console.warn('[webhook] bad signature');
      return res.status(400).send('invalid signature');
    }

    const payload = JSON.parse(req.body.toString());
    res.json({ ok: true });               // ack fast, process after

    if (payload.event !== 'payment.captured' && payload.event !== 'order.paid') return;

    const pay      = payload.payload.payment.entity;
    const rzpOrder = pay.order_id;

    const { data: order } = await supa.from('orders')
      .select('*').eq('razorpay_order_id', rzpOrder).maybeSingle();
    if (!order) { console.warn('[webhook] no order for', rzpOrder); return; }
    if (order.status === 'paid' || order.status === 'delivered') return;  // idempotent

    await supa.from('orders').update({
      status: 'paid',
      razorpay_payment_id: pay.id,
      amount_paid_cents: pay.amount,
      paid_at: new Date().toISOString()
    }).eq('id', order.id);

    const { data: lead } = await supa.from('leads').select('*').eq('id', order.lead_id).maybeSingle();
    if (!lead) return;
    await supa.from('leads').update({ stage: 'paid' }).eq('id', lead.id);

    const fresh = { ...order, status: 'paid', razorpay_payment_id: pay.id, amount_paid_cents: pay.amount };
    const tier = TIERS[order.tier_id];
    const needsIntake = order.track_count > 1;
    const intakeUrl = `${SITE_URL}/intake?order=${order.id}&t=${lead.resume_token}`;

    await sendEmail({
      type: 'order_confirmation', to: lead.email, leadId: lead.id, orderId: order.id,
      tpl: T.orderConfirmation({ name: lead.full_name, order: fresh, tier, email: lead.email, intakeUrl, needsIntake })
    });

    if (needsIntake) {
      await sendEmail({
        type: 'intake_request', to: lead.email, leadId: lead.id, orderId: order.id,
        tpl: T.intakeRequest({ name: lead.full_name, order: fresh, intakeUrl })
      });
    } else {
      // Single track: no second intake — straight into production
      await sendEmail({
        type: 'blueprint_confirmed', to: lead.email, leadId: lead.id, orderId: order.id,
        tpl: T.blueprintConfirmed({ name: lead.full_name, order: fresh, tier })
      });
      await generateAndNotify(order.id);
    }
  } catch (e) {
    console.error('[webhook]', e.message);
  }
});

/* ============================================================
   5. SECOND INTAKE (core / full only)
   ============================================================ */
app.post('/api/intake', async (req, res) => {
  try {
    const { orderId, tracks } = req.body || {};
    if (!orderId || !Array.isArray(tracks)) return res.status(400).json({ error: 'bad payload' });

    const { data: order } = await supa.from('orders').select('*').eq('id', orderId).maybeSingle();
    if (!order) return res.status(404).json({ error: 'order not found' });
    if (order.status !== 'paid' && order.status !== 'intake_complete')
      return res.status(403).json({ error: 'order not paid' });

    for (const t of tracks) {
      await supa.from('track_intakes').upsert({
        order_id: orderId,
        track_slot: t.slot,
        track_index: t.index || 1,
        intensity: t.intensity || null,
        vocal_cue: t.vocalCue || null,
        notes: t.notes || null,
        custom_fields: t.custom || {}
      }, { onConflict: 'order_id,track_slot' });
    }

    await supa.from('orders').update({ status: 'intake_complete' }).eq('id', orderId);
    await supa.from('leads').update({ stage: 'intake_complete' }).eq('id', order.lead_id);

    await generateAndNotify(orderId);
    res.json({ ok: true });
  } catch (e) {
    console.error('[intake]', e.message);
    res.status(500).json({ error: 'intake_failed' });
  }
});

/* ============================================================
   GENERATE PROMPTS + NOTIFY ADMIN
   ============================================================ */
async function generateAndNotify(orderId) {
  const { data: order } = await supa.from('orders').select('*').eq('id', orderId).maybeSingle();
  if (!order) return;
  const { data: lead } = await supa.from('leads').select('*').eq('id', order.lead_id).maybeSingle();
  const { data: q } = await supa.from('questionnaire_responses')
    .select('*').eq('lead_id', order.lead_id)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  const { data: intakes } = await supa.from('track_intakes').select('*').eq('order_id', orderId);

  const questionnaire = q || { shift: null, disruptors: [], timing: null, soundscape: [] };

  const specs = generateTrackSpecs({
    tierId: order.tier_id,
    shift: questionnaire.shift,
    timing: questionnaire.timing,
    disruptors: questionnaire.disruptors,
    soundscape: questionnaire.soundscape,
    countryName: lead && lead.country_name,
    customer: lead
  });

  // Fold per-track intake notes into the final prompt
  const byslot = {};
  (intakes || []).forEach(i => { byslot[i.track_slot] = i; });

  for (const s of specs) {
    const extra = byslot[s.track_slot];
    let finalPrompt = s.final_prompt;
    if (extra) {
      const adds = [];
      if (extra.intensity === 'gentle')  adds.push('Lighter and airier than default, less low-end weight');
      if (extra.intensity === 'deep')    adds.push('Heavier and darker than default, more low-end weight and density');
      if (extra.notes)                   adds.push(extra.notes);
      if (adds.length) finalPrompt = finalPrompt.replace(' Negative:', `. ${adds.join('. ')}. Negative:`);
    }
    await supa.from('generated_prompts').insert({
      order_id: orderId,
      track_slot: s.track_slot,
      track_index: s.track_index,
      spec_ref: `${order.tier_id}_${s.track_slot}`,
      base_prompt: s.final_prompt,
      final_prompt: finalPrompt,
      beat_params: s.beat_params,
      differentiator: s.differentiator
    });
    s.final_prompt = finalPrompt;

    await supa.from('deliveries').insert({
      order_id: orderId, track_slot: s.track_slot, title: s.title
    });
  }

  await supa.from('orders').update({ status: 'in_production' }).eq('id', orderId);

  await sendEmail({
    type: 'admin_new_intake', to: ADMIN_EMAIL, leadId: order.lead_id, orderId,
    tpl: T.adminNewIntake({
      order, lead, questionnaire, intakes: intakes || [], specs,
      adminUrl: `${SITE_URL}/admin`
    })
  });
}

/* ============================================================
   6. ADMIN — deliver finished audio
   ============================================================ */
async function requireAdmin(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'no token' });
    const { data: { user }, error } = await supa.auth.getUser(token);
    if (error || !user || user.email !== ADMIN_EMAIL)
      return res.status(403).json({ error: 'forbidden' });
    req.adminUser = user;
    next();
  } catch { res.status(401).json({ error: 'auth failed' }); }
}

app.post('/api/admin/deliver', requireAdmin, async (req, res) => {
  try {
    const { orderId, tracks } = req.body || {};
    const { data: order } = await supa.from('orders').select('*').eq('id', orderId).maybeSingle();
    if (!order) return res.status(404).json({ error: 'no order' });
    const { data: lead } = await supa.from('leads').select('*').eq('id', order.lead_id).maybeSingle();

    for (const t of tracks) {
      await supa.from('deliveries').update({
        mp3_url: t.mp3Url, wav_url: t.wavUrl, track_notes: t.notes || null,
        delivered_at: new Date().toISOString()
      }).eq('order_id', orderId).eq('track_slot', t.slot);
    }

    const { data: deliveries } = await supa.from('deliveries')
      .select('*').eq('order_id', orderId).not('delivered_at', 'is', null);

    const playerUrl = `${SITE_URL}/listen?order=${orderId}&t=${lead.resume_token}`;

    await sendEmail({
      type: 'blueprint_ready', to: lead.email, leadId: lead.id, orderId,
      tpl: T.blueprintReady({ name: lead.full_name, order, deliveries: deliveries || [], playerUrl })
    });

    await supa.from('orders').update({ status: 'delivered' }).eq('id', orderId);
    await supa.from('leads').update({ stage: 'delivered' }).eq('id', lead.id);
    await supa.from('deliveries').update({ email_sent_at: new Date().toISOString() }).eq('order_id', orderId);

    res.json({ ok: true, playerUrl });
  } catch (e) {
    console.error('[deliver]', e.message);
    res.status(500).json({ error: 'deliver_failed' });
  }
});

/* ---------- admin: full submission list ---------- */
app.get('/api/admin/submissions', requireAdmin, async (req, res) => {
  const { data, error } = await supa.from('admin_submissions').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ submissions: data });
});

/* ---------- admin: prompts for one order ---------- */
app.get('/api/admin/prompts/:orderId', requireAdmin, async (req, res) => {
  const { data } = await supa.from('generated_prompts')
    .select('*').eq('order_id', req.params.orderId).order('track_index');
  res.json({ prompts: data || [] });
});

/* ============================================================
   7. PUBLIC — player data (token-gated, no auth needed)
   ============================================================ */
app.get('/api/listen/:orderId', async (req, res) => {
  const { t } = req.query;
  const { data: order } = await supa.from('orders').select('*').eq('id', req.params.orderId).maybeSingle();
  if (!order) return res.status(404).json({ error: 'not found' });
  const { data: lead } = await supa.from('leads').select('*').eq('id', order.lead_id).maybeSingle();
  if (!lead || lead.resume_token !== t) return res.status(403).json({ error: 'forbidden' });

  const { data: deliveries } = await supa.from('deliveries')
    .select('track_slot,title,mp3_url,wav_url,track_notes')
    .eq('order_id', order.id).not('delivered_at', 'is', null);

  res.json({ customer: lead.full_name, tier: order.tier_name, tracks: deliveries || [] });
});

/* ---------- resume a saved session ---------- */
app.get('/api/resume/:token', async (req, res) => {
  const { data: lead } = await supa.from('leads')
    .select('*').eq('resume_token', req.params.token).maybeSingle();
  if (!lead) return res.status(404).json({ error: 'not found' });
  const { data: q } = await supa.from('questionnaire_responses')
    .select('*').eq('lead_id', lead.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  res.json({
    lead: {
      leadId: lead.id, fullName: lead.full_name, email: lead.email, phone: lead.phone,
      countryDial: lead.country_dial, countryFlag: lead.country_flag
    },
    answers: q || null,
    discountCode: lead.discount_code
  });
});

/* ============================================================
   8. ABANDONED CART SWEEP
   Run on a schedule (cron / Vercel Cron / Supabase pg_cron).
   Fires for anyone who reached tier_selected or checkout_opened
   but did not pay within 45 minutes.
   ============================================================ */
app.post('/api/cron/abandoned', async (req, res) => {
  if (req.headers['x-cron-key'] !== process.env.CRON_SECRET)
    return res.status(403).json({ error: 'forbidden' });

  const cutoff = new Date(Date.now() - 45 * 60 * 1000).toISOString();

  const { data: leads } = await supa.from('leads')
    .select('*')
    .in('stage', ['questionnaire_complete', 'tier_selected', 'checkout_opened'])
    .is('abandoned_email_sent_at', null)
    .lt('updated_at', cutoff)
    .limit(100);

  let sent = 0;
  for (const lead of leads || []) {
    const { data: paid } = await supa.from('orders')
      .select('id').eq('lead_id', lead.id).eq('status', 'paid').maybeSingle();
    if (paid) continue;

    const { data: lastOrder } = await supa.from('orders')
      .select('tier_id').eq('lead_id', lead.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    const code = 'BACK10-' + lead.id.slice(0, 6).toUpperCase();
    await supa.from('leads').update({
      discount_code: code, abandoned_email_sent_at: new Date().toISOString()
    }).eq('id', lead.id);

    await sendEmail({
      type: 'abandoned_cart', to: lead.email, leadId: lead.id,
      tpl: T.abandonedCart({
        name: lead.full_name,
        tier: lastOrder ? TIERS[lastOrder.tier_id] : null,
        resumeUrl: `${SITE_URL}/?resume=${lead.resume_token}`,
        discountCode: code,
        siteUrl: SITE_URL
      })
    });
    sent++;
  }
  res.json({ ok: true, sent });
});

app.get('/health', (_, res) => res.json({ ok: true, launchActive: launchActive() }));

app.listen(PORT, () => console.log(`Orvel backend listening on :${PORT}`));
