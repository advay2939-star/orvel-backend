/* ═══════════════════════════════════════════════════════════════
   Orvel — transactional email system
   One branded shell, seven templates, one send() helper.

   Email clients are not browsers. Everything here is table-based
   with inline styles, because Gmail strips <style> blocks and
   Outlook renders through Word. No flexbox, no grid, no web fonts
   as a dependency — Cormorant/DM Sans are requested for the clients
   that honour them and fall back to Georgia / system sans elsewhere,
   which keeps the serif-display, sans-body relationship intact.
═══════════════════════════════════════════════════════════════ */

const SITE = 'https://www.orvelsound.com';
const LOGO = `${SITE}/email-logo.png`;
const SUPPORT = 'orvelsound@gmail.com';

/* Brand tokens — lifted from the site's CSS custom properties so
   the emails and the page can never drift apart. */
const C = {
  paper:     '#F5F0E4',
  sand:      '#E4DAC3',
  ink:       '#1B1913',
  muted:     '#6E6555',
  navy:      '#141A2E',
  navyText:  '#E9E8F6',
  navyMuted: '#9BA1CB',
  teal:      '#04998A',
  peri:      '#AEB2F5',
  gold:      '#C99B34',
  line:      '#E0D9C7',
};

const SERIF = "'Cormorant Garamond',Georgia,'Times New Roman',serif";
const SANS  = "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO  = "'JetBrains Mono',ui-monospace,'SF Mono',Consolas,monospace";

const esc = v => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ── Building blocks ─────────────────────────────────────────── */

function button(label, href) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
    <tr><td align="center" bgcolor="${C.teal}" style="border-radius:4px;">
      <a href="${esc(href)}" style="display:inline-block;padding:15px 34px;font-family:${SANS};
         font-size:15px;font-weight:600;letter-spacing:0.02em;color:#FFFFFF;
         text-decoration:none;border-radius:4px;">${esc(label)}</a>
    </td></tr>
  </table>`;
}

/* Key/value panel on navy — used for order and brief summaries.
   Mirrors the "sample brief" card on the site. */
function panel(rows, heading) {
  const body = rows.filter(Boolean).map(([k, v]) => `
    <tr>
      <td style="padding:9px 0;font-family:${SANS};font-size:11px;letter-spacing:0.11em;
                 text-transform:uppercase;color:${C.navyMuted};">${esc(k)}</td>
      <td align="right" style="padding:9px 0;font-family:${SANS};font-size:14px;
                 color:${C.navyText};">${esc(v)}</td>
    </tr>`).join('');
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         bgcolor="${C.navy}" style="border-radius:10px;margin:26px 0;">
    <tr><td style="padding:22px 26px;">
      ${heading ? `<p style="margin:0 0 8px;font-family:${SERIF};font-size:19px;
                    color:${C.navyText};">${esc(heading)}</p>` : ''}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${body}
      </table>
    </td></tr>
  </table>`;
}

function note(text) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="margin:22px 0;border-left:2px solid ${C.gold};">
    <tr><td style="padding:2px 0 2px 16px;font-family:${SANS};font-size:14px;
      line-height:1.6;color:${C.muted};">${text}</td></tr></table>`;
}

const p = t => `<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;
  line-height:1.7;color:${C.ink};">${t}</p>`;

/* ── The shell every email is poured into ────────────────────── */

function shell({ preheader, heading, kicker, body, footerNote }) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
 "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>${esc(heading)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:${C.paper};">
  <!-- preheader: shown in the inbox preview, hidden in the body -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         bgcolor="${C.paper}" style="background-color:${C.paper};">
    <tr><td align="center" style="padding:32px 16px 48px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
             style="width:600px;max-width:100%;">

        <!-- header band -->
        <tr><td align="center" bgcolor="${C.navy}"
                style="padding:30px 0 26px;border-radius:10px 10px 0 0;">
          <img src="${LOGO}" width="48" height="48" alt="Orvel"
               style="display:block;border:0;width:48px;height:48px;border-radius:6px;" />
          <p style="margin:12px 0 0;font-family:${SANS};font-size:12px;letter-spacing:0.30em;
                    text-transform:uppercase;color:${C.peri};">Orvel</p>
          <p style="margin:4px 0 0;font-family:${SANS};font-size:10px;letter-spacing:0.20em;
                    text-transform:uppercase;color:${C.navyMuted};">Sleep System</p>
        </td></tr>

        <!-- body -->
        <tr><td bgcolor="#FFFFFF" style="padding:38px 40px 34px;
                border-left:1px solid ${C.line};border-right:1px solid ${C.line};">
          ${kicker ? `<p style="margin:0 0 10px;font-family:${SANS};font-size:11px;
                       letter-spacing:0.16em;text-transform:uppercase;color:${C.teal};">
                       ${esc(kicker)}</p>` : ''}
          <h1 style="margin:0 0 20px;font-family:${SERIF};font-size:31px;line-height:1.2;
                     font-weight:500;color:${C.ink};">${esc(heading)}</h1>
          ${body}
        </td></tr>

        <!-- footer -->
        <tr><td bgcolor="${C.sand}" style="padding:24px 40px 28px;border-radius:0 0 10px 10px;">
          ${footerNote ? `<p style="margin:0 0 14px;font-family:${SANS};font-size:13px;
                           line-height:1.6;color:${C.muted};">${footerNote}</p>` : ''}
          <p style="margin:0 0 10px;font-family:${SANS};font-size:13px;color:${C.muted};">
            Questions? Reply to this email or write to
            <a href="mailto:${SUPPORT}" style="color:${C.teal};text-decoration:none;">${SUPPORT}</a>.
          </p>
          <p style="margin:0;font-family:${SANS};font-size:12px;color:${C.muted};">
            <a href="${SITE}/privacy" style="color:${C.muted};">Privacy</a> &nbsp;·&nbsp;
            <a href="${SITE}/terms" style="color:${C.muted};">Terms</a> &nbsp;·&nbsp;
            <a href="${SITE}/refund" style="color:${C.muted};">Refunds</a> &nbsp;·&nbsp;
            <a href="${SITE}/contact" style="color:${C.muted};">Contact</a>
          </p>
          <p style="margin:14px 0 0;font-family:${SANS};font-size:11px;color:${C.muted};">
            Orvel · custom sleep and focus audio · ${esc(new Date().getFullYear())}
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const PLAN_NAME = { sleep: 'Sleep', full: 'Full Day', complete: 'Complete' };
const money = c => (c == null ? null : '$' + (c / 100).toFixed(0));

/* ── The seven templates ─────────────────────────────────────── */

export const templates = {

  /* 1 — payment confirmed, and the ask to complete the brief */
  paymentConfirmed: ({ name, packageId, amountCents, paymentRef, intakeUrl }) => ({
    subject: `Your Orvel order is confirmed — one step left`,
    html: shell({
      preheader: 'Your payment went through. Now tell us how you actually sleep.',
      kicker: 'Payment confirmed',
      heading: `Thanks${name ? ', ' + name : ''}. Now the important part.`,
      body:
        p(`Your payment has gone through and your order is confirmed. Nothing is built yet — and that's deliberate. Orvel isn't pulled from a library, so your tracks can't start until we know how you actually live.`) +
        panel([
          ['Package', PLAN_NAME[packageId] || packageId],
          ['Amount', money(amountCents)],
          ['Payment ref', paymentRef],
        ], 'Your order') +
        p(`The brief takes about five to seven minutes. It asks about your shift pattern, the noise you're up against, how easily you wake, and the kind of sound you actually like.`) +
        button('Complete my brief', intakeUrl) +
        note(`Your files arrive within 24&ndash;48 hours of the brief landing with us &mdash; not from now.`),
      footerNote: `If the button doesn't work, paste this into your browser:<br /><span style="font-family:${MONO};font-size:12px;word-break:break-all;">${esc(intakeUrl)}</span>`,
    }),
  }),

  /* 2 — nudge when the brief never arrived */
  intakeReminder: ({ name, packageId, intakeUrl }) => ({
    subject: `Your Orvel tracks are waiting on your brief`,
    html: shell({
      preheader: 'Five minutes and we can start building.',
      kicker: 'Reminder',
      heading: `We can't start without you`,
      body:
        p(`Hi${name ? ' ' + name : ''} — your ${PLAN_NAME[packageId] || 'Orvel'} order is paid and sitting in the queue, but your brief hasn't come through yet.`) +
        p(`We could guess. We'd rather not — a track built around the wrong schedule is just noise with good intentions.`) +
        button('Complete my brief', intakeUrl) +
        note(`Already filled it in? Then it has reached us and you can ignore this &mdash; nothing more is needed from you.`),
      footerNote: `Direct link:<br /><span style="font-family:${MONO};font-size:12px;word-break:break-all;">${esc(intakeUrl)}</span>`,
    }),
  }),

  /* 3 — brief received, production starts, 48-hour clock */
  briefReceived: ({ name, packageId, shiftPattern, playback, trackCount }) => ({
    subject: `Brief received — your tracks are in production`,
    html: shell({
      preheader: 'A producer is building your tracks now. 24–48 hours.',
      kicker: 'In production',
      heading: `Got it. We're building.`,
      body:
        p(`Thanks${name ? ', ' + name : ''} — your brief has reached the studio and a producer is working from your answers now.`) +
        panel([
          ['Package', PLAN_NAME[packageId] || packageId],
          ['Tracks', trackCount ? String(trackCount) : null],
          ['Schedule', shiftPattern],
          ['Playback', playback],
        ], 'What we\'re building around') +
        p(`Expect your files within 24&ndash;48 hours, delivered as MP3 and WAV. Nothing to install, no app, no subscription.`) +
        note(`Spotted something wrong above? Reply to this email in the next few hours and we'll correct it before production finishes.`),
    }),
  }),

  /* 4 — delivery */
  delivery: ({ name, packageId, downloadUrl, trackCount }) => ({
    subject: `Your Orvel tracks are ready`,
    html: shell({
      preheader: 'Your files are ready to download.',
      kicker: 'Delivered',
      heading: `Your tracks are ready`,
      body:
        p(`Hi${name ? ' ' + name : ''} — your ${PLAN_NAME[packageId] || 'Orvel'} system is built and waiting for you. ${trackCount ? `All ${trackCount} tracks are` : 'Your files are'} included as both MP3 and WAV.`) +
        button('Download my tracks', downloadUrl) +
        p(`<strong style="color:${C.ink};">Save the files somewhere safe.</strong> They're yours to keep — there's no app and no library to log back into.`) +
        note(`Not quite right? You have <strong>one free revision within 14 days</strong>. Reply and tell us what's off &mdash; be specific, it helps. If it still misses after that, we refund you in full and you keep the files either way.`),
      footerNote: `Download link:<br /><span style="font-family:${MONO};font-size:12px;word-break:break-all;">${esc(downloadUrl)}</span>`,
    }),
  }),

  /* 5 — revision delivered */
  revisionDelivered: ({ name, downloadUrl, changeSummary }) => ({
    subject: `Your revised Orvel tracks are ready`,
    html: shell({
      preheader: 'Rebuilt from your notes.',
      kicker: 'Revision delivered',
      heading: `Rebuilt, and ready`,
      body:
        p(`Hi${name ? ' ' + name : ''} — we've rebuilt your tracks from the notes you sent.`) +
        (changeSummary ? panel([['What changed', changeSummary]]) : '') +
        button('Download the revised files', downloadUrl) +
        note(`If this still isn't right, reply and we'll refund you in full &mdash; and you keep every file we've made.`),
      footerNote: `Download link:<br /><span style="font-family:${MONO};font-size:12px;word-break:break-all;">${esc(downloadUrl)}</span>`,
    }),
  }),

  /* 6 — studio alert, new brief */
  studioNewBrief: ({ fullName, email, packageId, paymentRef, shiftPattern, playback,
                     maskingTargets, wakeSensitivity, subscribedRefresh }) => ({
    subject: `New brief — ${PLAN_NAME[packageId] || packageId} — ${fullName || email || 'customer'}`,
    html: shell({
      preheader: `New ${PLAN_NAME[packageId] || packageId} brief to produce.`,
      kicker: 'Studio alert',
      heading: `New brief to produce`,
      body:
        panel([
          ['Customer', fullName || '—'],
          ['Email', email || '—'],
          ['Package', PLAN_NAME[packageId] || packageId],
          ['Payment ref', paymentRef],
          ['Schedule', shiftPattern],
          ['Playback', playback],
          ['Wake sensitivity', wakeSensitivity],
          ['Masking', Array.isArray(maskingTargets) ? maskingTargets.join(', ') : maskingTargets],
          ['Refresh opt-in', subscribedRefresh ? 'Yes' : 'No'],
        ], 'Brief summary') +
        p(`Full answers are in the admin console. The 48-hour clock started when this landed.`) +
        (playback && /speaker/i.test(String(playback))
          ? note(`<strong style="color:${C.ink};">Speaker playback.</strong> Drop the binaural layer &mdash; it needs discrete signal per ear. Build the masking bed instead.`)
          : ''),
    }),
  }),

  /* 7 — studio alert, revision request */
  studioRevisionRequest: ({ fullName, email, packageId, paymentRef, requestText }) => ({
    subject: `Revision requested — ${fullName || email || 'customer'}`,
    html: shell({
      preheader: 'A customer has asked for their free revision.',
      kicker: 'Studio alert',
      heading: `Revision requested`,
      body:
        panel([
          ['Customer', fullName || '—'],
          ['Email', email || '—'],
          ['Package', PLAN_NAME[packageId] || packageId],
          ['Payment ref', paymentRef],
        ]) +
        p(`<strong style="color:${C.ink};">In their words:</strong>`) +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin:0 0 20px;border-left:2px solid ${C.teal};">
           <tr><td style="padding:6px 0 6px 16px;font-family:${SANS};font-size:15px;
             line-height:1.7;color:${C.ink};">${esc(requestText || '(no detail given)')}</td></tr>
         </table>` +
        note(`This is their one free revision. If it misses again, the refund is automatic &mdash; and they keep the files.`),
    }),
  }),
};

/* ── Sending ─────────────────────────────────────────────────── */

export async function sendEmail({ to, template, data }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.warn('sendEmail: RESEND_API_KEY missing, skipped'); return { ok: false }; }

  const build = templates[template];
  if (!build) throw new Error(`Unknown email template: ${template}`);
  const { subject, html } = build(data || {});

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || `Orvel <${SUPPORT}>`,
      reply_to: SUPPORT,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    console.error('sendEmail failed', res.status, await res.text());
    return { ok: false };
  }
  return { ok: true };
}
