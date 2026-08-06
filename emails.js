/* ============================================================
   ORVEL — EMAIL TEMPLATES (Resend)
   ============================================================ */
'use strict';

const BRAND = {
  bg:      '#14120e',
  surface: '#1c1a15',
  card:    '#211e18',
  border:  'rgba(255,255,255,0.09)',
  text:    '#f2efe6',
  muted:   '#a8a294',
  accent:  '#049b8b',
  accent2: '#e8c97a',
  serif:   "Georgia, 'Times New Roman', serif",
  mono:    "'SF Mono', Menlo, monospace"
};

const money = c => '$' + (Number.isInteger(c / 100) ? (c / 100).toFixed(0) : (c / 100).toFixed(2));

function shell({ preheader, body }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader || ''}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden;">
  <tr><td style="padding:28px 32px 0;">
    <div style="font-family:${BRAND.mono};font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${BRAND.accent};">ORVEL</div>
  </td></tr>
  <tr><td style="padding:20px 32px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${BRAND.text};font-size:15px;line-height:1.65;">
    ${body}
  </td></tr>
  <tr><td style="padding:20px 32px 28px;border-top:1px solid ${BRAND.border};font-family:-apple-system,sans-serif;font-size:11px;color:${BRAND.muted};line-height:1.6;">
    Orvel — personalized binaural audio built around your real schedule.<br>
    Not a medical device. Designed to support relaxation and wind-down; it does not treat or cure any sleep disorder.<br>
    Use headphones. Do not listen while driving or operating machinery.
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

const btn = (url, label) =>
  `<a href="${url}" style="display:inline-block;background:${BRAND.accent};color:#04120f;text-decoration:none;
   font-weight:600;font-size:14px;padding:13px 26px;border-radius:6px;">${label}</a>`;

const h1 = t => `<h1 style="font-family:${BRAND.serif};font-weight:400;font-size:25px;line-height:1.25;margin:0 0 16px;color:${BRAND.text};">${t}</h1>`;
const p  = t => `<p style="margin:0 0 15px;color:${BRAND.text};">${t}</p>`;
const dim= t => `<p style="margin:0 0 15px;color:${BRAND.muted};font-size:13px;">${t}</p>`;

function row(k, v) {
  return `<tr>
    <td style="padding:9px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.muted};font-size:13px;width:45%;">${k}</td>
    <td style="padding:9px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.text};font-size:13px;font-weight:600;">${v}</td>
  </tr>`;
}
const table = rows => `<table width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 20px;">${rows}</table>`;

/* ============================================================
   1. ABANDONED CART — $10 off, resume link
   ============================================================ */
function abandonedCart({ name, tier, resumeUrl, discountCode, siteUrl }) {
  const first = (name || '').split(' ')[0] || 'there';
  const body = `
    ${h1(`Your track is still waiting, ${first}.`)}
    ${p(`You got as far as picking <strong>${tier ? tier.name : 'your track'}</strong> — everything you answered is saved, so you can pick up exactly where you left off.`)}
    ${p(`Here's why it's worth finishing:`)}
    <ul style="margin:0 0 18px;padding-left:20px;color:${BRAND.text};">
      <li style="margin-bottom:8px;">Built around <strong>your actual roster</strong> — not a generic 10pm bedtime that assumes you work days.</li>
      <li style="margin-bottom:8px;">A deterministic binaural layer tuned to when <em>you</em> need to fall asleep, verified frequency-accurate on every render.</li>
      <li style="margin-bottom:8px;">A soundscape built from what you told us actually disrupts your sleep.</li>
      <li style="margin-bottom:8px;">MP3 + WAV, delivered in 3 working days, with a free revision.</li>
    </ul>
    <div style="background:${BRAND.card};border:1px solid ${BRAND.accent};border-radius:8px;padding:18px;margin:0 0 22px;text-align:center;">
      <div style="font-family:${BRAND.mono};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND.accent2};margin-bottom:6px;">A little nudge</div>
      <div style="font-family:${BRAND.serif};font-size:27px;color:${BRAND.text};margin-bottom:4px;">$10 off</div>
      <div style="font-family:${BRAND.mono};font-size:13px;color:${BRAND.accent};letter-spacing:0.1em;">${discountCode}</div>
    </div>
    <div style="text-align:center;margin-bottom:18px;">${btn(resumeUrl, 'Finish my track →')}</div>
    ${dim(`Your answers are saved on this link — you won't have to fill anything in again.`)}
  `;
  return { subject: `${first}, your Orvel track is still saved (+ $10 off)`, html: shell({ preheader: `Your answers are saved. $10 off inside.`, body }) };
}

/* ============================================================
   2. ORDER CONFIRMATION — payment successful
   ============================================================ */
function orderConfirmation({ name, order, tier, email, intakeUrl, needsIntake }) {
  const first = (name || '').split(' ')[0] || 'there';
  const body = `
    ${h1('Your Orvel Sound Blueprint is confirmed.')}
    ${p(`Hi ${first} — thank you for your purchase. Your order is confirmed and your production slot is booked.`)}
    ${table(
      row('Service', tier.name) +
      row('Tracks included', `${order.track_count} ${order.track_count === 1 ? 'track' : 'tracks'}`) +
      row('Email', email) +
      row('Amount paid', money(order.amount_paid_cents)) +
      (order.balance_cents > 0 ? row('Balance on delivery', money(order.balance_cents)) : '') +
      row('Payment ID', `<span style="font-family:${BRAND.mono};font-size:11px;">${order.razorpay_payment_id || '—'}</span>`) +
      row('Order ID', `<span style="font-family:${BRAND.mono};font-size:11px;">${order.razorpay_order_id || order.id}</span>`)
    )}
    ${needsIntake ? `
      ${p(`<strong>One more step.</strong> Because you've got ${order.track_count} tracks, you can customize each one individually — so your Wind-down doesn't just sound like a brighter copy of your Sleep track.`)}
      <div style="text-align:center;margin:20px 0;">${btn(intakeUrl, 'Customize my tracks →')}</div>
      ${dim('Takes about 2 minutes. Production starts once this is in.')}
    ` : `
      ${p(`<strong>What happens next:</strong> your track will be with you within <strong>3 working days</strong>. You get <strong>one free revision</strong>, and any further revision after that is $9.90.`)}
    `}
  `;
  return { subject: `Order confirmed — your Orvel Sound Blueprint`, html: shell({ preheader: `${tier.name} · ${money(order.amount_paid_cents)} paid`, body }) };
}

/* ============================================================
   3. BLUEPRINT CONFIRMED — single-track ($39) buyers
   ============================================================ */
function blueprintConfirmed({ name, order, tier }) {
  const first = (name || '').split(' ')[0] || 'there';
  const body = `
    ${h1('Your blueprint is in production.')}
    ${p(`Hi ${first} — your intake is with a producer and your ${tier.name} is being built now.`)}
    ${table(
      row('Delivery', 'Within 3 working days') +
      row('Format', 'MP3 + WAV') +
      row('Free revisions', '1 included') +
      row('Additional revision', '$9.90 each')
    )}
    ${p(`You'll get an email the moment it's ready, with a link to stream it in your browser and download both formats.`)}
    ${dim(`Use stereo headphones. The binaural layer depends on each ear receiving a slightly different tone — speakers or a single earbud will collapse the effect.`)}
  `;
  return { subject: 'Your Orvel blueprint is in production', html: shell({ preheader: 'Delivery within 3 working days.', body }) };
}

/* ============================================================
   4. INTAKE REQUEST — multi-track customization
   ============================================================ */
function intakeRequest({ name, order, intakeUrl }) {
  const first = (name || '').split(' ')[0] || 'there';
  const body = `
    ${h1('Customize each of your tracks.')}
    ${p(`Hi ${first} — you've got <strong>${order.track_count} tracks</strong>, and each one targets a different state. Tell us how you want each one to feel and we'll build them to genuinely differ, not just re-skin one bed.`)}
    <div style="text-align:center;margin:20px 0;">${btn(intakeUrl, 'Open my intake form →')}</div>
    ${dim('Production starts once this is submitted.')}
  `;
  return { subject: 'Customize your Orvel tracks', html: shell({ preheader: 'One short form, then production starts.', body }) };
}

/* ============================================================
   5. BLUEPRINT READY — delivery with player + downloads
   ============================================================ */
function blueprintReady({ name, order, deliveries, playerUrl }) {
  const first = (name || '').split(' ')[0] || 'there';
  const list = deliveries.map(d => `
    <div style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:8px;padding:16px;margin-bottom:12px;">
      <div style="font-family:${BRAND.serif};font-size:17px;color:${BRAND.text};margin-bottom:8px;">${d.title}</div>
      ${d.track_notes ? `<div style="font-size:12px;color:${BRAND.muted};line-height:1.6;margin-bottom:12px;">${d.track_notes}</div>` : ''}
      <a href="${d.wav_url}" style="display:inline-block;border:1px solid ${BRAND.accent};color:${BRAND.accent};text-decoration:none;font-size:12px;padding:8px 15px;border-radius:5px;margin-right:8px;">Download WAV</a>
      <a href="${d.mp3_url}" style="display:inline-block;border:1px solid ${BRAND.border};color:${BRAND.muted};text-decoration:none;font-size:12px;padding:8px 15px;border-radius:5px;">Download MP3</a>
    </div>`).join('');

  const body = `
    ${h1(`${first}, your blueprint is ready.`)}
    ${p(`Your ${order.track_count === 1 ? 'track has' : 'tracks have'} been built, frequency-verified, and ${order.track_count === 1 ? 'is' : 'are'} ready to listen to.`)}
    <div style="text-align:center;margin:20px 0;">${btn(playerUrl, '▶  Play in your browser')}</div>
    ${list}
    ${dim(`<strong>Use stereo headphones.</strong> WAV is the authoritative file — the binaural layer is carried in the phase difference between channels, which lossy formats can degrade. Use the MP3 for convenience, the WAV for effect.`)}
    ${dim(`One free revision is included. Just reply to this email.`)}
  `;
  return { subject: `Your Orvel blueprint is ready`, html: shell({ preheader: 'Stream it or download WAV + MP3.', body }) };
}

/* ============================================================
   6. ADMIN — new intake landed
   ============================================================ */
function adminNewIntake({ order, lead, questionnaire, intakes, specs, adminUrl }) {
  const body = `
    ${h1('New intake received')}
    ${table(
      row('Customer', lead.full_name) +
      row('Email', lead.email) +
      row('Phone', `${lead.country_dial} ${lead.phone}`) +
      row('Country', lead.country_name || '—') +
      row('Service', `${order.tier_name} (${order.track_count} tracks)`) +
      row('Paid', money(order.amount_paid_cents)) +
      row('Payment ID', `<span style="font-family:${BRAND.mono};font-size:11px;">${order.razorpay_payment_id || '—'}</span>`)
    )}
    <div style="font-family:${BRAND.mono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.accent};margin:22px 0 8px;">Questionnaire</div>
    ${table(
      row('Schedule', questionnaire.shift || '—') +
      row('Disruptors', (questionnaire.disruptors || []).join(', ') || '—') +
      row('Needs sleep', questionnaire.timing || '—') +
      row('Soundscape', (questionnaire.soundscape || []).join(', ') || '—')
    )}
    ${intakes && intakes.length ? `
      <div style="font-family:${BRAND.mono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.accent};margin:22px 0 8px;">Per-track customization</div>
      ${table(intakes.map(i => row(i.track_slot, `${i.intensity || '—'}${i.notes ? ' · ' + i.notes : ''}`)).join(''))}
    ` : ''}
    <div style="font-family:${BRAND.mono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.accent};margin:22px 0 8px;">Generated specs</div>
    ${(specs || []).map(s => `
      <div style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:6px;padding:14px;margin-bottom:10px;">
        <div style="color:${BRAND.text};font-size:14px;font-weight:600;margin-bottom:6px;">${s.title} — ${s.band}</div>
        <div style="font-family:${BRAND.mono};font-size:11px;color:${BRAND.accent2};margin-bottom:8px;">
          carrier ${s.beat_params.carrier_hz} Hz · hold ${s.beat_params.hold_hz} Hz · ${s.beat_params.lufs} LUFS · loop ${s.beat_params.loop_hours || 0}h
        </div>
        <div style="font-size:11px;color:${BRAND.muted};line-height:1.6;">${s.final_prompt}</div>
      </div>`).join('')}
    <div style="text-align:center;margin:20px 0;">${btn(adminUrl, 'Open admin portal →')}</div>
  `;
  return { subject: `New intake — ${lead.full_name} (${order.tier_name})`, html: shell({ preheader: `${order.track_count} tracks · ${money(order.amount_paid_cents)}`, body }) };
}

module.exports = {
  abandonedCart, orderConfirmation, blueprintConfirmed,
  intakeRequest, blueprintReady, adminNewIntake, money
};
