#!/usr/bin/env python3
"""Orvel niche landing pages — one template, one content file. Writes <slug>.html to OUT."""
import html, sys, os, re
sys.path.insert(0, os.path.dirname(__file__))
from niches import NICHES, SHARED_FAQ, SHOTS

SP = os.path.dirname(os.path.abspath(__file__)) + '/'
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(SP, '..', '..', '1-website-LIVE')

CSS = open(SP + 'lp_css.css').read()
for a, b in [('.hero-grid,.audio-grid,.faq-grid,.demo-grid,.prob-top,', '.hero-grid,.audio-grid,.faq-grid,.prob-top,'),
             ('  .demo-grid .ph{display:none}\n', ''), ('  .founder{grid-template-columns:1fr}\n', ''),
             ('  .readout .v{font-size:1.6rem}\n', '')]:
    assert CSS.count(a) == 1, a
    CSS = CSS.replace(a, b)
CSS += '.prob-top.nostat{grid-template-columns:1fr}\n.tl-note.warn{border:1px solid rgba(201,155,52,.45);border-radius:var(--r-lg);padding:1rem 1.2rem;background:rgba(201,155,52,.07);color:var(--ink)}\n'
JS = open(SP + 'lp_js.js').read()

def img(pid, w, q=70):
    return f'https://images.unsplash.com/photo-{pid}?auto=format&amp;fit=crop&amp;w={w}&amp;q={q}'

def fig(p, cls='ph', extra='', lazy=True, w=800, wh=(800, 600)):
    pos = f' style="object-position:{p["pos"]}"' if p.get('pos') else ''
    ld = ' loading="lazy"' if lazy else ' fetchpriority="high"'
    return (f'<figure class="{cls}"{extra}>\n        <img{ld} src="{img(p["id"], w)}" width="{wh[0]}" height="{wh[1]}"{pos}\n'
            f'             alt="{html.escape(p["alt"])}">\n        <figcaption>{p["cap"]}</figcaption>\n      </figure>')

def spec_rows(rows):
    return '\n'.join(f'        <div class="spec-row"><span class="spec-k">{k}</span><span class="spec-v{" accent" if a else ""}">{v}</span></div>'
                     for k, v, a in rows)

CHECK = '<svg width="13" height="13" aria-hidden="true"><use href="#ico-check"/></svg>'

def build(n):
    s = n['slug']
    buy = lambda plan: f'/?buy={plan}&amp;ref={s}'
    hero = n['hero']
    P = n['prob']
    # ── stat
    if P.get('stat'):
        st = P['stat']
        stat = f'''
      <div class="stat rv rv-d2">
        <div class="stat-row">
          <div><div class="stat-n">{st["n"]}</div><div class="stat-l">{st["n_l"]}</div></div>
          <div><div class="stat-n off">{st["off"]}</div><div class="stat-l">{st["off_l"]}</div></div>
        </div>
        <span class="src">{st["src"]}</span>
      </div>'''
    else:
        stat = ''
    cards = '\n'.join(f'''      <div class="prob rv{" rv-d" + str(i) if i else ""}">
        <span class="n">0{i+1} · {c[0]}</span>
        <h3>{c[1]}</h3>
        <p>{c[2]}</p>
      </div>''' for i, c in enumerate(P['cards']))
    # ── compare
    cmp_rows = [n.get('cmp_first', ('What wakes you', "Doesn't know", 'Masking floor shaped to the noise that wakes you')),
                n.get('cmp_when', ('When you sleep', 'Assumes a night-time bedtime', 'Built around your actual sleep window')),
                ('How you listen', 'One file for everyone', 'Mixed for earbuds, headphones or a speaker'),
                ('What you like hearing', 'Rain, whether you like it or not', 'Your texture, your depth, no melody unless you want it'),
                ('Interruptions', 'Ads, autoplay, phone screen', 'Your files, offline, nothing in between')]
    cmp = '\n'.join(f'''      <div class="cmp-row" role="row">
        <div class="q" role="rowheader">{q}</div>
        <div class="g" role="cell"><span class="gl">Loop</span>{g}</div>
        <div class="o" role="cell"><span class="ol">Orvel</span>{o}</div>
      </div>''' for q, g, o in cmp_rows)
    # ── timeline
    T = n['tl']
    items = '\n'.join(f'''      <div class="tl-item{" c" if it[3] == "Complete" else ""} rv{" rv-d" + str(min(i,3)) if i else ""}">
        <span class="tl-dot"></span>
        <span class="tl-time">{it[0]}</span>
        <h3>{it[1]}</h3>
        <p>{it[2]}</p>
        <span class="tl-plan">{it[3]}</span>
      </div>''' for i, it in enumerate(T['items']))
    tl_note = ''
    if T.get('note'):
        tl_note = f'''
    <p class="tl-note{" warn" if T.get("note_warn") else ""} rv">
      <svg width="15" height="15" aria-hidden="true"><use href="#ico-shield"/></svg>
      <span>{T["note"]}</span>
    </p>'''
    # ── arrives
    A = n['arrive']
    files = '\n'.join(f'            <div class="file"><span class="ic">WAV</span><span>0{i+1} · {t}</span><em>MP3 + WAV</em></div>'
                      for i, t in enumerate(A.get('files', ['Wind-down', 'Sleep', 'Morning', 'Focus'])))
    # ── plans
    pf = n['plans']
    # ── faq
    faqs = n['faq'] + [SHARED_FAQ[k] for k in n.get('faq_shared', ['white', 'playback', 'after', 'refund', 'sub', 'medical'])]
    faq = '\n'.join(f'''      <div class="faq-item{" open" if i == 0 else ""}">
        <button class="faq-q" type="button" aria-expanded="{"true" if i == 0 else "false"}">{q}<span class="faq-ico" aria-hidden="true">+</span></button>
        <div class="faq-a"><div><p>{a}</p></div></div>
      </div>''' for i, (q, a) in enumerate(faqs))
    # ── credits
    seen, credits = set(), []
    for p in [hero['photo']] + P['photos'] + [T['photo']]:
        if p['id'] in seen: continue
        seen.add(p['id']); credits.append(f'<a href="{p["href"]}" target="_blank" rel="noopener">{p["by"]}</a>')
    credit_txt = ', '.join(credits[:-1]) + ' and ' + credits[-1] if len(credits) > 1 else credits[0]
    hp = hero['photo']
    hpos = f' style="object-position:{hp["pos"]}"' if hp.get('pos') else ''
    final = n['final']

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>{n["title"]}</title>
<meta name="description" content="{html.escape(n["desc"])}">
<meta name="theme-color" content="#F5F0E4">
<link rel="canonical" href="https://www.orvelsound.com/{s}">
<meta property="og:title" content="{html.escape(n["og"])}">
<meta property="og:description" content="{html.escape(n["desc"])}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://www.orvelsound.com/{s}">
<meta property="og:image" content="https://images.unsplash.com/photo-{hp["id"]}?auto=format&amp;fit=crop&amp;w=1200&amp;h=630&amp;q=75">
<link rel="icon" href="data:image/svg%2Bxml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%23141A2E'/%3E%3Ccircle cx='50' cy='50' r='37' fill='none' stroke='%23AEB2F5' stroke-width='3.2'/%3E%3Cpath d='M62 31.5C46 32.6 40 43 49.5 50.5C59 58 53 68.4 37 69.5' fill='none' stroke='%23C8CAFF' stroke-width='5.4' stroke-linecap='round'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://images.unsplash.com">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>{CSS}</style>

<!-- Meta Pixel — set META_PIXEL_ID below; nothing loads while it's empty -->
<script>
window.ORVEL_LP = {{
  NICHE: '{s}',
  META_PIXEL_ID: '',          // same ID as index.html
  CHECKOUT_URL: '/',          // main site; ?buy=<plan>&ref=<niche> opens checkout pre-selected
  REVIEWS: [
    /* Only real reviews from real customers, with their permission. Leave empty and the section stays hidden.
       {{ quote:'…', by:'{n["review_eg"]}' }} */
  ],
}};
(function(){{
  var id = window.ORVEL_LP.META_PIXEL_ID; if (!id) return;
  !function(f,b,e,v,n,t,s){{if(f.fbq)return;n=f.fbq=function(){{n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)}};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
  s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', id); fbq('track', 'PageView');
  fbq('track', 'ViewContent', {{ content_name: 'lp_' + window.ORVEL_LP.NICHE, content_category: 'landing' }});
}})();
</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="orvel-mark" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#141A2E"/>
      <circle cx="50" cy="50" r="37" fill="none" stroke="#AEB2F5" stroke-width="3.2"/>
      <path d="M62 31.5C46 32.6 40 43 49.5 50.5C59 58 53 68.4 37 69.5" fill="none" stroke="#C8CAFF" stroke-width="5.4" stroke-linecap="round"/>
    </symbol>
    <symbol id="ico-check" viewBox="0 0 14 14"><path d="M2 7.5l3.4 3.4L12 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="ico-shield" viewBox="0 0 16 16"><path d="M8 1.4l5.4 2v4.2c0 3.2-2.2 5.9-5.4 7-3.2-1.1-5.4-3.8-5.4-7V3.4l5.4-2Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M5.6 8.1l1.7 1.7 3.3-3.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="ico-info" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 7.2v4M8 4.9v.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
  </defs>
</svg>

<header id="nav">
  <a class="brand" href="/" aria-label="Orvel home">
    <svg class="mark" aria-hidden="true"><use href="#orvel-mark"/></svg>
    <span class="brand-word">Orvel</span>
    <span class="brand-tag">{n["tag"]}</span>
  </a>
  <a class="nav-cta" data-buy="full" href="{buy("full")}">Build mine</a>
</header>

<main id="main">

<!-- ═══ HERO ═══ -->
<section id="hero">
  <div class="hero-grid">
    <div>
      <p class="eyebrow eb-gold">{hero["eyebrow"]}</p>
      <h1 class="hero-h1">{hero["h1"]}</h1>
      <p class="hero-sub">{hero["sub"]}</p>
      <div class="hero-btns">
        <a class="btn btn-primary btn-lg" data-buy="full" href="{buy("full")}">{hero["cta"]} <span class="price">$99</span></a>
        <a class="btn btn-ghost btn-lg" href="#listen">
          <svg width="11" height="12" viewBox="0 0 11 12" aria-hidden="true"><path d="M1 1L10 6L1 11V1Z" fill="currentColor"/></svg>
          Hear a sample
        </a>
      </div>
      <p class="assure">
        <svg width="15" height="15" aria-hidden="true"><use href="#ico-shield"/></svg>
        <span><b>One free rebuild if it misses.</b> Still not right after that and we refund you in full. You keep the files either way.</span>
      </p>
      <p class="trust">One-time payment<i>·</i>MP3 + WAV<i>·</i>24–48 hr delivery<i>·</i>No app</p>
    </div>

    <div class="hero-visual">
      <figure class="ph">
        <img src="{img(hp["id"], 900, 72)}"
             srcset="{img(hp["id"], 600, 72)} 600w,
                     {img(hp["id"], 900, 72)} 900w,
                     {img(hp["id"], 1300, 72)} 1300w"
             sizes="(max-width:960px) 92vw, 520px" width="900" height="1125" fetchpriority="high"{hpos}
             alt="{html.escape(hp["alt"])}">
        <figcaption>{hp["cap"]}</figcaption>
      </figure>
      <div class="spec" aria-label="Example brief">
        <div class="spec-top">
          <div class="spec-title"><svg width="20" height="20" aria-hidden="true"><use href="#orvel-mark"/></svg><b>{hero["spec_title"]}</b></div>
          <span class="spec-tag">Example</span>
        </div>
{spec_rows(hero["spec"])}
      </div>
    </div>
  </div>
</section>

<!-- ═══ PROBLEM ═══ -->
<section class="band dark">
  <div class="wrap">
    <div class="prob-top{"" if stat else " nostat"}">
      <div>
        <p class="eyebrow rv">{P["eyebrow"]}</p>
        <h2 class="rv rv-d1">{P["h2"]}</h2>
        <p class="lede rv rv-d2">{P["lede"]}</p>
      </div>{stat}
    </div>

    <div class="prob-photos">
      {fig(P["photos"][0], cls="ph rv", w=800)}
      {fig(P["photos"][1], cls="ph rv rv-d1", w=800)}
    </div>

    <div class="prob-grid">
{cards}
    </div>
  </div>
</section>

<!-- ═══ RESEARCH ═══ -->
<section class="band dark" id="research">
  <div class="wrap">
    <p class="eyebrow rv">The research behind it</p>
    <h2 class="rv rv-d1">It isn't the noise that wakes you. <em class="hl">It's the jump.</em></h2>

    <div class="res-grid">
      <div class="res rv">
        <span class="mono">Sleep lab · ICU noise</span>
        <h3>Same hospital noise. A steady sound underneath it. Far fewer wake-ups.</h3>
        <p>Researchers played recorded intensive-care noise to sleeping volunteers. Brief awakenings rose from 13 an hour to 48.
          With steady white noise added under the same ICU noise, they came back down to 16. What decided whether
          someone woke wasn't how loud the peaks were. It was how far they jumped above the background.</p>
        <div class="bars" aria-label="Arousals from sleep per hour">
          <div class="bar"><span>Quiet room</span><span class="track"><span class="fill" data-w="27"></span></span><b>13.3</b></div>
          <div class="bar hot"><span>ICU noise</span><span class="track"><span class="fill" data-w="100"></span></span><b>48.4</b></div>
          <div class="bar good"><span>ICU noise + steady sound</span><span class="track"><span class="fill" data-w="32"></span></span><b>15.7</b></div>
          <span class="bars-k">Arousals from sleep, per hour</span>
        </div>
        <span class="src">Stanchina et al., <i>Sleep Medicine</i>, 2005. Polysomnography, small sample.
          <a href="https://pubmed.ncbi.nlm.nih.gov/16139772/" target="_blank" rel="noopener">Read the abstract</a></span>
      </div>

      <div style="display:grid;gap:1rem;align-content:start">
        <div class="res rv rv-d1">
          <span class="mono">Hospital shift workers</span>
          <h3>{n.get("res2_h3", "Tested on people coming off nights.")}</h3>
          <p>26 emergency-medicine doctors working overnight shifts used noise-masking earbuds for two weeks. On the days they used them,
            they reported better sleep quality and less sleepiness and tension than in the two weeks before. The changes were modest and self-reported, but consistent.</p>
          <span class="src">Duggan et al., <i>JMIR Formative Research</i>, 2022.
            <a href="https://pubmed.ncbi.nlm.nih.gov/35315781/" target="_blank" rel="noopener">Read the abstract</a></span>
        </div>
        <div class="honest rv rv-d2">
          <svg width="16" height="16" aria-hidden="true"><use href="#ico-info"/></svg>
          <span>These studies tested plain white noise and masking earbuds, not Orvel, and they're small. We show them because they explain
            the principle every Orvel track is built on: a steady floor makes the same noise a smaller jump. Orvel is wellness audio, not a medical treatment.</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ COMPARE ═══ -->
<section class="band">
  <div class="wrap">
    <p class="eyebrow eb-teal rv">{n.get("cmp_eyebrow", "Why not just a rain video?")}</p>
    <h2 class="rv rv-d1">{n.get("cmp_h2", "A rain video is the same for everyone. Your room isn't.")}</h2>
    <div class="cmp rv rv-d2" role="table" aria-label="A generic sleep video compared with Orvel">
      <div class="cmp-row cmp-head" role="row">
        <div role="columnheader">&nbsp;</div><div role="columnheader">{n.get("cmp_vs", "8-hour YouTube loop")}</div><div role="columnheader" class="o">Orvel, built for you</div>
      </div>
{cmp}
    </div>
  </div>
</section>

<!-- ═══ TIMELINE ═══ -->
<section class="band paper2">
  <div class="wrap">
    <div class="tl-head">
      <div>
        <p class="eyebrow eb-teal rv">{T["eyebrow"]}</p>
        <h2 class="rv rv-d1">{T["h2"]}</h2>
        <p class="lede rv rv-d2">{T["lede"]}</p>
      </div>
      {fig(T["photo"], cls="ph rv rv-d1", w=1000, wh=(1000, 625))}
    </div>

    <div class="tl">
{items}
    </div>{tl_note}
  </div>
</section>

<!-- ═══ LISTEN ═══ -->
<section class="band" id="listen">
  <div class="wrap audio-grid">
    <div>
      <p class="eyebrow eb-teal rv">Press play</p>
      <h2 class="rv rv-d1">Hear the sound world before you order.</h2>
      <p class="lede rv rv-d2">Two finished Orvel soundscapes, unedited. Use headphones if you can, because the stereo field is part of the design.
        They start quiet and build, so give them a few seconds. They aren't your track. Yours is built from your answers.</p>
    </div>
    <div class="player rv rv-d1" id="player">
      <div class="pl-tabs" role="tablist" aria-label="Soundscapes">
        <button class="pl-tab" role="tab" aria-selected="true" data-i="0">Subsurface</button>
        <button class="pl-tab" role="tab" aria-selected="false" data-i="1">Deep Submersion</button>
      </div>
      <div class="pl-body">
        <button class="pl-play" id="pl-play" type="button" aria-label="Play">
          <svg id="pl-ico" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 2.5L15 9L4 15.5V2.5Z" fill="currentColor"/></svg>
        </button>
        <div class="pl-meta">
          <div class="pl-name" id="pl-name">Subsurface</div>
          <div class="pl-sub" id="pl-sub">Low · deep · slow-moving</div>
        </div>
      </div>
      <div class="pl-wave" id="pl-wave" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>
      <div class="pl-time"><span id="pl-cur">0:00</span><span id="pl-dur">—:—</span></div>
      <p class="pl-err" id="pl-err" role="alert">This sample couldn't load. Try the other one, or refresh the page.</p>
    </div>
  </div>
</section>

<!-- ═══ WHAT ARRIVES ═══ -->
<section class="band paper2">
  <div class="wrap">
    <p class="eyebrow eb-teal rv">What you actually get</p>
    <h2 class="rv rv-d1">Your files, and a note on <em class="hl">why</em> each one sounds the way it does.</h2>
    <p class="lede rv rv-d2">Every track comes with Track Notes: what we heard in your brief and what we built in response. This is an example for a {A["track"]} track.</p>

    <div class="arr-grid">
      <div class="mail rv">
        <div class="mail-bar"><i></i><i></i><i></i></div>
        <div class="mail-h">
          <div class="mail-from"><svg width="26" height="26" aria-hidden="true"><use href="#orvel-mark"/></svg><b>Orvel</b><span>· to you</span></div>
          <div class="mail-subj">{A["subj"]}</div>
        </div>
        <div class="mail-body">
          {A["body"]}
          <div class="files">
{files}
            <div class="file"><span class="ic pdf">NOTES</span><span>Track Notes</span><em>4 tracks</em></div>
          </div>
        </div>
      </div>

      <div class="notes rv rv-d1">
        <div class="spec-top">
          <div class="spec-title"><svg width="20" height="20" aria-hidden="true"><use href="#orvel-mark"/></svg><b>Track Notes · {A["track"]}</b></div>
          <span class="spec-tag">Example</span>
        </div>
        <h3>“{A["quote"]}”</h3>
{spec_rows(A["rows"])}
      </div>
    </div>
  </div>
</section>

<!-- ═══ HOW IT WORKS ═══ -->
<section class="band">
  <div class="wrap">
    <p class="eyebrow eb-teal rv">How it works</p>
    <h2 class="rv rv-d1">{n["steps_h2"]}</h2>
    <div class="steps">
      <div class="step rv">
        <span class="n">1</span>
        <h3>Pick your plan</h3>
        <p>One payment. No app, no account and no subscription unless you choose one.</p>
        <span class="mono t">2 minutes</span>
      </div>
      <div class="step rv rv-d1">
        <span class="n">2</span>
        <h3>Answer the brief</h3>
        <p>{n["brief_step"]} It's built for a tired brain, so it's mostly tap-to-answer.</p>
        <span class="mono t">5–7 minutes</span>
      </div>
      <div class="step rv rv-d2">
        <span class="n">3</span>
        <h3>Get your files</h3>
        <p>MP3 + WAV by email, with Track Notes explaining what was built and why. They go on your phone and play offline.</p>
        <span class="mono t">Within 24–48 hours</span>
      </div>
    </div>
  </div>
</section>

<!-- ═══ REVIEWS (hidden until real ones are added) ═══ -->
<section class="band paper2" id="reviews" hidden>
  <div class="wrap">
    <p class="eyebrow eb-teal">{n["review_eyebrow"]}</p>
    <h2>In their words.</h2>
    <div class="rev-grid" id="rev-grid"></div>
  </div>
</section>

<!-- ═══ PRICING ═══ -->
<section class="band dark" id="pricing">
  <div class="wrap">
    <div class="pricing-head">
      <p class="eyebrow rv">Pricing</p>
      <h2 class="rv rv-d1">Pay once. Keep the files.</h2>
      <p class="lede rv rv-d2">{n["pricing_lede"]}</p>
    </div>
    <div class="plans">
      <div class="plan rv">
        <span class="plan-n">Plan 01</span>
        <h3>Sleep</h3>
        <span class="plan-tracks">2 custom tracks</span>
        <div class="plan-price"><sup>$</sup>69</div>
        <span class="plan-once">One-time</span>
        <p class="plan-for">“{pf[0]}”</p>
        <ul>
          <li>{CHECK}<span>Wind-down · Sleep</span></li>
          <li>{CHECK}<span>Built from your full brief</span></li>
          <li>{CHECK}<span>MP3 + WAV, Track Notes</span></li>
          <li>{CHECK}<span>One free revision each</span></li>
        </ul>
        <a class="btn btn-ghost" data-buy="sleep" href="{buy("sleep")}">Choose Sleep</a>
      </div>
      <div class="plan feat rv rv-d1">
        <span class="plan-flag">{n["flag"]}</span>
        <span class="plan-n">Plan 02</span>
        <h3>Full Day</h3>
        <span class="plan-tracks">4 custom tracks</span>
        <div class="plan-price"><sup>$</sup>99</div>
        <span class="plan-once">One-time</span>
        <p class="plan-for">“{pf[1]}”</p>
        <ul>
          <li>{CHECK}<span>Wind-down · Sleep · Morning · Focus</span></li>
          <li>{CHECK}<span>Four tracks built as one system</span></li>
          <li>{CHECK}<span>MP3 + WAV, Track Notes</span></li>
          <li>{CHECK}<span>One free revision each</span></li>
        </ul>
        <a class="btn btn-peri" data-buy="full" href="{buy("full")}">Choose Full Day</a>
      </div>
      <div class="plan rv rv-d2">
        <span class="plan-n">Plan 03</span>
        <h3>Complete</h3>
        <span class="plan-tracks">5 custom tracks</span>
        <div class="plan-price"><sup>$</sup>149</div>
        <span class="plan-once">One-time</span>
        <p class="plan-for">“{pf[2]}”</p>
        <ul>
          <li>{CHECK}<span>Everything in Full Day</span></li>
          <li>{CHECK}<span>Plus the Afternoon Reset</span></li>
          <li>{CHECK}<span>MP3 + WAV, Track Notes</span></li>
          <li>{CHECK}<span>One free revision each</span></li>
        </ul>
        <a class="btn btn-ghost" data-buy="complete" href="{buy("complete")}">Choose Complete</a>
      </div>
    </div>
    <p class="pricing-foot rv">One-time payment<i>·</i>No subscription<i>·</i>Yours to keep</p>
    <div class="guarantee rv">
      <svg width="22" height="22" aria-hidden="true"><use href="#ico-shield"/></svg>
      <div>
        <b>Built for you, or you don't pay for it.</b>
        <p>Tell us what's off within 14 days of delivery and we'll rebuild the track once, free. If the rebuild still isn't right,
          we refund you in full, and you keep the files.</p>
      </div>
    </div>
  </div>
</section>

<!-- ═══ FAQ ═══ -->
<section class="band">
  <div class="wrap faq-grid">
    <div>
      <p class="eyebrow eb-teal rv">Questions</p>
      <h2 class="rv rv-d1">{n["faq_h2"]}</h2>
      <p class="lede rv rv-d2" style="font-size:.92rem">Anything else? Email
        <a href="mailto:orvelsound@gmail.com" style="color:var(--teal)">orvelsound@gmail.com</a> and a person will reply.</p>
    </div>
    <div id="faq">
{faq}
    </div>
  </div>
</section>

<!-- ═══ FINAL CTA ═══ -->
<section class="band paper2" id="final">
  <div class="wrap">
    <p class="eyebrow eb-gold rv">{final["eyebrow"]}</p>
    <h2 class="rv rv-d1">{final["h2"]}</h2>
    <p class="lede rv rv-d2">{final.get("lede", "Built from your answers. Mixed for your room. In your inbox within 48 hours.")}</p>
    <p class="assure rv">
      <svg width="15" height="15" aria-hidden="true"><use href="#ico-shield"/></svg>
      <span><b>One free rebuild, then a full refund if it still misses.</b></span>
    </p>
    <a class="btn btn-primary btn-lg rv" data-buy="full" href="{buy("full")}">{hero["cta"]} <span class="price">$99</span></a>
    <p class="trust rv">Or start with sleep only<i>·</i><a data-buy="sleep" href="{buy("sleep")}">$69</a></p>
  </div>
</section>
</main>

<footer>
  <div class="wrap">
    <div class="f-top">
      <div>
        <div class="f-brand"><svg width="30" height="30" aria-hidden="true"><use href="#orvel-mark"/></svg><b>Orvel</b></div>
        <p class="f-tag">Custom wellness audio, built around the hours your life actually runs. Made after you order, by a person.</p>
      </div>
      <nav class="f-links" aria-label="Footer">
        <a href="/">Orvel home</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/refund">Refunds</a>
        <a href="/contact">Contact</a>
        <a href="mailto:orvelsound@gmail.com">orvelsound@gmail.com</a>
      </nav>
    </div>
    <div class="f-bot">
      <span>© <span id="yr">2026</span> Orvel</span>
      <p>Orvel is a wellness audio product and is not intended to diagnose, treat, cure or prevent any medical condition. Individual experiences vary.</p>
      <p>Photos are illustrative and show models, not Orvel customers. Photography on Unsplash by {credit_txt}.</p>
    </div>
  </div>
</footer>

<div id="sticky" role="region" aria-label="Order">
  <div class="s-txt">Full Day system · $99<span>4 custom tracks · one-time</span></div>
  <a class="btn btn-primary" data-buy="full" href="{buy("full")}">Build mine</a>
</div>

<script>{JS}</script>
</body>
</html>
'''

if __name__ == '__main__':
    only = sys.argv[2:] or list(NICHES)
    for slug in only:
        page = build(NICHES[slug])
        # sanity: no leftover python braces / placeholders
        assert '{n[' not in page and '{{' not in page.split('<script>')[0]
        open(os.path.join(OUT, slug + '.html'), 'w').write(page)
        print('wrote', slug, len(page))
