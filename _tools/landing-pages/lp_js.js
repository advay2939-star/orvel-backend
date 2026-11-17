
'use strict';
document.documentElement.classList.add('js');
(function(){
  var LP = window.ORVEL_LP;
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function px(type, name, data){ try { if (window.fbq) fbq(type, name, data); } catch(_){} }

  /* ── CTA links: carry plan + niche + ad attribution into checkout ── */
  var keep = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid'];
  var here = new URLSearchParams(location.search);
  $$('[data-buy]').forEach(function(a){
    var u = new URL(LP.CHECKOUT_URL, location.href);
    u.searchParams.set('buy', a.getAttribute('data-buy'));
    u.searchParams.set('ref', LP.NICHE);
    keep.forEach(function(k){ if (here.get(k)) u.searchParams.set(k, here.get(k)); });
    a.href = u.pathname + u.search;
    a.addEventListener('click', function(){ px('trackCustom', 'LP_BuildClick', { niche: LP.NICHE, plan: a.getAttribute('data-buy') }); });
  });

  /* ── photos: hide the frame cleanly if an image ever fails ── */
  $$('.ph img').forEach(function(img){ img.addEventListener('error', function(){ img.closest('.ph').classList.add('broken'); }); });

  /* ── nav + sticky bar ── */
  var nav = $('#nav'), sticky = $('#sticky'), hero = $('#hero'), pricing = $('#pricing'), finalCta = $('#final');
  function onScroll(){
    var y = window.scrollY;
    nav.classList.toggle('solid', y > 12);
    var pastHero = y > hero.offsetHeight - 120;
    var r1 = pricing.getBoundingClientRect(), r2 = finalCta.getBoundingClientRect(), vh = innerHeight;
    var overPlans = (r1.top < vh && r1.bottom > 0) || (r2.top < vh && r2.bottom > 0);
    sticky.classList.toggle('up', pastHero && !overPlans);
  }
  addEventListener('scroll', onScroll, { passive:true }); onScroll();

  /* ── reveals (+ research bars) ── */
  function reveal(el){
    el.classList.add('in');
    $$('.fill', el).forEach(function(f){ f.style.width = f.getAttribute('data-w') + '%'; });
  }
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ reveal(e.target); io.unobserve(e.target); } });
    }, { rootMargin:'0px 0px -8% 0px', threshold:.08 });
    $$('.rv').forEach(function(el){ io.observe(el); });
  } else { $$('.rv').forEach(reveal); }

  /* ── FAQ ── */
  $$('#faq .faq-q').forEach(function(q){
    q.addEventListener('click', function(){
      var item = q.parentNode, open = !item.classList.contains('open');
      item.classList.toggle('open', open); q.setAttribute('aria-expanded', open);
    });
  });

  /* ── reviews (real ones only) ── */
  if (LP.REVIEWS && LP.REVIEWS.length){
    var esc = function(t){ var d = document.createElement('div'); d.textContent = t; return d.innerHTML; };
    $('#rev-grid').innerHTML = LP.REVIEWS.map(function(r){
      return '<div class="rev"><div class="stars" aria-label="5 out of 5">★★★★★</div><blockquote>“' + esc(r.quote) +
             '”</blockquote><p class="by">' + esc(r.by) + '</p></div>';
    }).join('');
    $('#reviews').hidden = false;
  }

  /* ── deterministic waveform bars ── */
  function bars(el, n, seed, minH){
    var s = seed, html = '';
    for (var i = 0; i < n; i++){
      s = (s * 9301 + 49297) % 233280;
      var env = Math.sin(Math.PI * (i + .5) / n);
      var h = Math.max(minH, Math.round((0.25 + 0.75 * env) * (0.45 + 0.55 * s / 233280) * 100));
      html += '<i style="height:' + h + '%"></i>';
    }
    el.innerHTML = html;
  }

  /* ── sample player ── */
  var TRACKS = [
    { name:'Subsurface',      sub:'Low · deep · slow-moving',     file:'audio/Subsurface.m4a',      seed:11 },
    { name:'Deep Submersion', sub:'Darker · denser · enveloping', file:'audio/Deep_Submersion.m4a', seed:23 },
  ];
  var audio = new Audio(); audio.preload = 'none';
  var cur = 0, wave = $('#pl-wave'), N = 72;
  var ICON_PLAY = '<path d="M4 2.5L15 9L4 15.5V2.5Z" fill="currentColor"/>';
  var ICON_PAUSE = '<rect x="4" y="3" width="3.6" height="12" rx="1" fill="currentColor"/><rect x="10.4" y="3" width="3.6" height="12" rx="1" fill="currentColor"/>';
  function fmt(t){ if (!isFinite(t)) return '—:—'; t = Math.floor(t); return Math.floor(t/60) + ':' + ('0' + t % 60).slice(-2); }
  function load(i, autoplay){
    cur = i; var t = TRACKS[i];
    $$('.pl-tab').forEach(function(b, j){ b.setAttribute('aria-selected', j === i); });
    $('#pl-name').textContent = t.name; $('#pl-sub').textContent = t.sub;
    $('#pl-err').style.display = 'none';
    bars(wave, N, t.seed, 8);
    audio.src = t.file; $('#pl-cur').textContent = '0:00'; $('#pl-dur').textContent = '—:—';
    paint(0);
    if (autoplay) play();
  }
  function paint(p){
    var on = Math.round(p * N);
    $$('i', wave).forEach(function(b, j){ b.classList.toggle('on', j < on); });
    wave.setAttribute('aria-valuenow', Math.round(p * 100));
  }
  function play(){
    var pr = audio.play();
    if (pr && pr.catch) pr.catch(function(){ $('#pl-err').style.display = 'block'; });
    px('trackCustom', 'LP_SamplePlay', { niche: LP.NICHE, track: TRACKS[cur].name });
  }
  $('#pl-play').addEventListener('click', function(){ audio.paused ? play() : audio.pause(); });
  audio.addEventListener('play', function(){ $('#pl-ico').innerHTML = ICON_PAUSE; $('#pl-play').setAttribute('aria-label','Pause'); });
  audio.addEventListener('pause', function(){ $('#pl-ico').innerHTML = ICON_PLAY; $('#pl-play').setAttribute('aria-label','Play'); });
  audio.addEventListener('loadedmetadata', function(){ $('#pl-dur').textContent = fmt(audio.duration); });
  audio.addEventListener('timeupdate', function(){
    $('#pl-cur').textContent = fmt(audio.currentTime);
    if (audio.duration) paint(audio.currentTime / audio.duration);
  });
  audio.addEventListener('error', function(){ if (audio.getAttribute('src')) $('#pl-err').style.display = 'block'; });
  $$('.pl-tab').forEach(function(b){
    b.addEventListener('click', function(){ var playing = !audio.paused; audio.pause(); load(+b.dataset.i, playing); });
  });
  function seekTo(clientX){
    var r = wave.getBoundingClientRect(), p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    if (audio.duration){ audio.currentTime = p * audio.duration; paint(p); }
    else { audio.addEventListener('loadedmetadata', function once(){ audio.currentTime = p * audio.duration; audio.removeEventListener('loadedmetadata', once); }); play(); }
  }
  wave.addEventListener('pointerdown', function(e){ seekTo(e.clientX); });
  wave.addEventListener('keydown', function(e){
    if (!audio.duration) return;
    if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
    if (e.key === 'ArrowLeft')  audio.currentTime = Math.max(0, audio.currentTime - 10);
  });

  load(0, false);
  $('#yr').textContent = new Date().getFullYear();
})();
