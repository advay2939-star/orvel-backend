/* ============================================================
   ORVEL — COMPOSITIONAL PROMPT ENGINE
   Turns a questionnaire response + tier into 1, 2, or 4
   fully-specified track builds (prompt + beat params).

   Derived from the 18 production specs in the research doc.
   ============================================================ */

'use strict';

/* ---------- Q1 × Q3 → BEAT SCHEDULE + CARRIER ---------- */
const BEAT_MATRIX = {
  'Night shift': {
    'Right after a night shift ends': {
      carrier: 400, rampMin: 25,
      phases: [[0,8,10.0,6.0],[8,18,6.0,3.0],[18,25,3.0,2.5]], hold: 2.5,
      note: 'Starts at alpha to meet high post-shift alertness, then descends.'
    },
    'It changes every week': {
      carrier: 400, rampMin: 20,
      phases: [[0,7,8.0,5.0],[7,15,5.0,3.0],[15,20,3.0,2.5]], hold: 2.5,
      note: 'Neutral theta→delta, no circadian assumption.'
    },
    _default: {
      carrier: 400, rampMin: 25,
      phases: [[0,8,10.0,6.0],[8,18,6.0,3.0],[18,25,3.0,2.5]], hold: 2.5,
      note: 'Post-shift default.'
    }
  },
  'Rotating shift': {
    'Between rotating shifts': {
      carrier: 400, rampMin: 20,
      phases: [[0,8,8.0,5.0],[8,16,5.0,3.5],[16,20,3.5,3.0]], hold: 3.0,
      note: 'Theta onset then delta hold; phase-neutral.'
    },
    _default: {
      carrier: 400, rampMin: 20,
      phases: [[0,7,8.0,5.0],[7,15,5.0,3.0],[15,20,3.0,2.5]], hold: 2.5,
      note: 'Maximum robustness for unstable phase.'
    }
  },
  'Early morning starts': {
    'Before an early start': {
      carrier: 380, rampMin: 35,
      phases: [[0,12,7.0,5.5],[12,26,5.5,3.5],[26,35,3.5,2.5]], hold: 2.5,
      note: 'Longest ramp — evening sleep fights the wake-maintenance zone.'
    },
    _default: {
      carrier: 400, rampMin: 25,
      phases: [[0,8,8.0,5.0],[8,18,5.0,3.0],[18,25,3.0,2.5]], hold: 2.5,
      note: 'Early-start default.'
    }
  },
  'Long irregular hours': {
    _default: {
      carrier: 400, rampMin: 20,
      phases: [[0,7,8.0,5.0],[7,15,5.0,3.0],[15,20,3.0,2.5]], hold: 2.5,
      note: 'General-purpose neutral descent.'
    }
  }
};

/* ---------- Q1 → BASE BED LANGUAGE ---------- */
const BASE_MODULES = {
  'Night shift':
    'Deep ambient drone soundscape for daytime rest after a night shift. Dark warm analog synthesizer pads held as one continuous unbroken drone, slightly detuned, tape-saturated, sitting low and heavy in the mix. Interior and closed, as if heard from under blankets in a curtained room. Long spacious reverb, cavernous but muffled, high frequencies rolled off',
  'Rotating shift':
    'Neutral calm ambient soundscape built to work at any hour of the day or night. Soft sustained synthesizer pads, warm and matte, holding a single unchanging colour. Moderate interior reverb, slightly closed. Featureless and non-specific, carrying no time-of-day association',
  'Early morning starts':
    'Warm evening ambient soundscape for falling asleep early before a pre-dawn start. Opens extremely gently and almost imperceptibly, taking minutes to fully arrive. Low soft synthesizer pads, rounded and warm. Dusk atmosphere, dim amber warmth, interior and safe. Long slow reverb, generous decay',
  'Long irregular hours':
    'Minimal neutral ambient soundscape for someone on unpredictable hours. Steady soft synthesizer drone, plain and unadorned, carrying no mood of its own and no time-of-day association. Moderate interior reverb, unobtrusive and dependable'
};

/* ---------- Q3 → TIMING MODIFIER ---------- */
const TIMING_MODULES = {
  'Right after a night shift ends': 'Dense and continuously enveloping, built to hold against a bright active daytime',
  'Before an early start':         'Extra-long gentle introduction that arrives almost imperceptibly, patient and unhurried',
  'Between rotating shifts':       'Flexible any-hour calm, equally appropriate at noon or midnight',
  'It changes every week':         'Robust and unmarked by time of day, works identically at any hour'
};

/* ---------- Q2 → ADDITIVE MODIFIERS ---------- */
const DISRUPTOR_MODULES = {
  'Racing mind after a shift': {
    text: 'The texture drifts hypnotically with no melodic hooks and no events, monotonous by design, offering nothing to anticipate or follow, attention-dissolving',
    negatives: ['no melodic figures', 'no recurring motifs'],
    mix: 'Zero salient events in the loop body.'
  },
  'Daylight & noise during the day': {
    text: 'A dense broadband masking layer runs throughout, weighted to the low frequencies to swallow traffic and household noise, wide and dense with no gaps or holes anywhere in the texture',
    negatives: ['no silence gaps', 'no thinning'],
    mix: 'Brown weighting −6 dB/oct below 250 Hz. Carrier moves to ~12 dB below bed RMS with a 1/2-oct notch at carrier ±50 Hz.'
  },
  "Can't switch off from work stress": {
    text: 'The pads swell and recede in slow ten-second breaths, six cycles per minute, each swell easing in and out with no edge, parasympathetic warmth, physically settling',
    negatives: ['no sharp swell edges'],
    mix: '0.1 Hz (10 s) amplitude modulation on the pad layer only, ±3 dB, never swelling to silence.'
  },
  "Waking up before you're rested": {
    text: 'Runs completely unbroken from beginning to end with no fade in and no fade out, sustained through the entire night, uniform with no events and nothing that could register as a change',
    negatives: ['no fades', 'no gaps'],
    mix: 'No fade at either end. LRA narrowed to ~5–6 LU. Zero amplitude dips >1 dB across the full render.'
  },
  'Schedule changes too often': {
    text: 'Completely featureless and non-specific, uniformly calm, carrying no cue to time of day',
    negatives: ['no time-of-day colouration'],
    mix: 'No strong tonal centre that would read as morning or evening.'
  }
};

/* ---------- Q4 → PALETTE MODULES ---------- */
const PALETTE_MODULES = {
  'Ocean & waves': {
    key: 'ocean', maskingRank: 3,
    text: 'Gentle ocean waves rolling in slow ten-second cycles, distant surf with no crashes, soft foam wash receding across a wide stereo field',
    negatives: ['no crashing waves'],
    band: '500 Hz – 4 kHz'
  },
  'Rain & storms': {
    key: 'rain', maskingRank: 4,
    text: 'Steady unbroken rainfall, mid-weight and consistent, no individual droplets standing out, forming a continuous wall of broadband texture, with a low rumbling bed of distant thunder that never resolves into a strike',
    negatives: ['no thunder claps'],
    band: 'above 1 kHz + low rumble'
  },
  'Forest & nature': {
    key: 'forest', maskingRank: 1,
    text: 'Soft forest ambience, gentle wind moving through leaves, faint rustle, sparse distant birdsong far off in the trees, natural open-air reverb at mid-distance',
    negatives: ['no loud bird calls'],
    band: '1–4 kHz'
  },
  'Deep tones & drones': {
    key: 'drone', maskingRank: 3,
    text: 'A deep sustained drone forms a low warm tonal bed, built from layered analog oscillators with a slow subharmonic hum beneath, warm, thick and slightly grainy',
    negatives: ['no tonal movement'],
    band: 'below 150 Hz'
  },
  'Pure silence with subtle tone': {
    key: 'silence', maskingRank: 0,
    text: 'Almost nothing present: a vast quiet space with a single very faint sustained tone sitting far back at the threshold of hearing, unchanging in pitch and level, with only the faintest sense of still air',
    negatives: ['no noise wash', 'no dense texture'],
    band: 'sparse, tone ~700 Hz'
  }
};

/* ---------- TRACK SLOT DEFINITIONS ---------- */
const TRACK_SLOTS = {
  sleep: {
    index: 1, title: 'Sleep Track',
    state: 'Sleep onset and maintenance',
    band: 'Theta → Delta',
    bpm: 'Beatless, no tempo',
    lufs: -19,
    durationMin: null,      // inherits ramp, then loops
    loopHours: 6,
    differentiator: 'The anchor track. Full descent to delta and held all night.'
  },
  winddown: {
    index: 2, title: 'Wind-down Track',
    state: 'Pre-sleep de-arousal',
    band: 'Alpha → Theta (stops at 6 Hz — deliberately does NOT reach delta)',
    bpm: 'Tempo decelerating gently from sixty beats per minute toward stillness, with no perceptible pulse',
    lufs: -20,
    beat: { carrierOffset: 0, phases: [[0,6,10.0,8.0],[6,15,8.0,6.0]], hold: 6.0, rampMin: 15 },
    durationMin: 20,
    loopHours: 0,
    differentiator: 'Stops at theta so it does not compete with the Sleep track that follows it. Brighter, more open, shorter and bounded — a session, not a night.'
  },
  focus: {
    index: 3, title: 'Focus Track',
    state: 'Sustained concentration on shift',
    band: 'Alpha → Low Beta (ascending)',
    bpm: 'Beatless, no tempo',
    lufs: -18,
    beat: { carrier: 300, phases: [[0,5,10.0,12.0],[5,12,12.0,14.0]], hold: 14.0, rampMin: 12 },
    durationMin: 40,
    loopHours: 0,
    differentiator: 'Ascending, not descending. Carrier drops to 300 Hz. Bright spectral tilt with no HF rolloff, clean and defined rather than washy — the opposite mix character to the sleep track.'
  },
  morning: {
    index: 4, title: 'Morning Track',
    state: 'Waking, dispelling sleep inertia',
    band: 'Beta → Gamma (ascending to 40 Hz)',
    bpm: 'Gentle pulse at around eighty beats per minute felt as a soft breathing motion in the pads, with no accented downbeats',
    lufs: -16,
    beat: { carrier: 250, phases: [[0,4,14.0,18.0],[4,10,18.0,40.0]], hold: 40.0, rampMin: 10 },
    durationMin: 15,
    loopHours: 0,
    differentiator: 'The inverse of every other track: ascending to 40 Hz gamma, carrier lowered to 250 Hz to keep a 40 Hz difference phase-lockable, brightest master in the set (−16 LUFS). Must never be delivered into a sleep context.'
  }
};

const TIER_TRACKS = {
  sleep: ['sleep'],
  core:  ['sleep', 'winddown'],
  full:  ['sleep', 'winddown', 'focus', 'morning']
};

/* ---------- UNIVERSAL NEGATIVES ---------- */
const BASE_NEGATIVES = [
  'no drums','no percussion','no beat','no melody','no chord progression',
  'no vocals','no build','no crescendo','no risers','no dynamic peaks','no sudden transients'
];

/* ============================================================
   CONFLICT RESOLUTION
   ============================================================ */
function resolvePalettes(soundscape, disruptors) {
  let picks = (soundscape || []).map(s => PALETTE_MODULES[s]).filter(Boolean);
  if (!picks.length) picks = [PALETTE_MODULES['Deep tones & drones']];

  const needsMasking = (disruptors || []).includes('Daylight & noise during the day');

  // RULE 2: masking requirement overrides "pure silence"
  if (needsMasking && picks.some(p => p.key === 'silence')) {
    picks = picks.filter(p => p.key !== 'silence');
    if (!picks.length) picks = [PALETTE_MODULES['Rain & storms']];
  }

  // Sort so the more masking-capable palette becomes the bed
  picks.sort((a, b) => b.maskingRank - a.maskingRank);
  return picks;
}

function buildPaletteText(picks, disruptors) {
  if (picks.length === 1) return picks[0].text;
  const [bed, accent] = picks;
  let accentText = accent.text;
  // RULE: with racing mind, strip salient events from the accent layer
  if ((disruptors || []).includes('Racing mind after a shift') && accent.key === 'forest') {
    accentText = 'a soft distant forest ambience held well back in the mix, far-off wind in leaves with no birdsong';
  }
  return `${bed.text}. Behind it, ${accentText}, kept clearly subordinate in the mix`;
}

/* ============================================================
   PROMPT ASSEMBLY
   ============================================================ */
function buildPrompt({ shift, timing, disruptors, soundscape, slot, countryName }) {
  const S = TRACK_SLOTS[slot];
  const picks = resolvePalettes(soundscape, disruptors);

  const parts = [];
  parts.push('TrackType: Instrument.');

  if (slot === 'sleep') {
    parts.push(BASE_MODULES[shift] || BASE_MODULES['Long irregular hours']);
  } else if (slot === 'winddown') {
    parts.push('Warm ambient wind-down soundscape for releasing the day before sleep. Soft warm synthesizer pads, rounded and generous, more open and less dark than a night-time sleep bed. Wide stereo image, long warm reverb, low-mid weighted with softened highs');
  } else if (slot === 'focus') {
    parts.push('Minimal ambient focus soundscape for sustained concentration during a working shift. Soft sustained synthesizer pads, clean and slightly bright, holding steady with subtle warm texture beneath. Moderate controlled reverb, present but not washy, keeping the sound close and defined. Alert calm rather than sleepiness');
  } else if (slot === 'morning') {
    parts.push('Bright warm ambient waking soundscape for surfacing from sleep and shaking off grogginess. Gently rising synthesizer pads, clear and open, gradually brightening in tone and opening in width. Soft high shimmer, airy and light. Fresh dawn atmosphere, cool early light, open natural reverb with clear definition and no murk');
  }

  // Palette — softened for the waking track
  if (slot === 'morning') {
    parts.push(picks[0].key === 'silence'
      ? 'A faint high sustained tone hangs above, bright and clear'
      : picks[0].text.replace(/dark|muffled|heavy/gi, 'clear'));
  } else {
    parts.push(buildPaletteText(picks, disruptors));
  }

  // Timing (sleep + winddown only — focus/morning are not sleep-timed)
  if (slot === 'sleep' || slot === 'winddown') {
    const t = TIMING_MODULES[timing];
    if (t) parts.push(t);
  }

  // Disruptor modifiers
  const negatives = new Set(BASE_NEGATIVES);
  picks.forEach(p => (p.negatives || []).forEach(n => negatives.add(n)));

  (disruptors || []).forEach(d => {
    const m = DISRUPTOR_MODULES[d];
    if (!m) return;
    // Sleep-maintenance + morning are contradictory; skip continuity language on the wake track
    if (slot === 'morning' && d === "Waking up before you're rested") return;
    if (slot === 'focus'   && d === "Waking up before you're rested") return;
    parts.push(m.text);
    (m.negatives || []).forEach(n => negatives.add(n));
  });

  // Mood + dynamics
  if (slot === 'sleep')    parts.push('Cocooning, heavy, womb-like, enveloping, sedative, deeply restful. Flat static dynamics from start to finish, no arc, no destination');
  if (slot === 'winddown') parts.push('Calm, settling, tension-releasing, unhurried, physically soothing. Level dynamics with only the slow breathing motion moving');
  if (slot === 'focus')    parts.push('Steady, even, transparent, quietly energising, completely unobtrusive and designed to recede from attention entirely. Consistent level throughout with no development');
  if (slot === 'morning')  parts.push('Uplifting, clarifying, gently energising, optimistic without being loud or startling');

  parts.push(S.bpm);

  if (slot === 'morning') { negatives.add('no alarms'); negatives.add('no dark heavy drones'); negatives.add('no bass rumble'); }
  if (slot === 'focus')   { negatives.add('no dark heavy drones'); }

  parts.push('Negative: ' + Array.from(negatives).join(', ') + '.');
  parts.push('Seamless loop.');

  return parts.join(' ').replace(/\s+/g, ' ').replace(/\.\s*\./g, '.').trim();
}

/* ---------- BEAT PARAMS ---------- */
function buildBeatParams({ shift, timing, disruptors, soundscape, slot }) {
  const S = TRACK_SLOTS[slot];

  if (slot !== 'sleep' && S.beat) {
    return {
      carrier_hz: S.beat.carrier || 400,
      phases: S.beat.phases,
      hold_hz: S.beat.hold,
      ramp_minutes: S.beat.rampMin,
      duration_minutes: S.durationMin,
      loop_hours: S.loopHours,
      lufs: S.lufs,
      true_peak_dbtp: -1.0,
      band: S.band
    };
  }

  const byShift = BEAT_MATRIX[shift] || BEAT_MATRIX['Long irregular hours'];
  const m = byShift[timing] || byShift._default;

  const maintenance = (disruptors || []).includes("Waking up before you're rested");
  const masking     = (disruptors || []).includes('Daylight & noise during the day');
  const silenceOnly = (soundscape || []).length === 1 &&
                      (soundscape || [])[0] === 'Pure silence with subtle tone';

  let lufs = -19;
  if (masking) lufs = -18;
  if (silenceOnly && !masking) lufs = -22;

  return {
    carrier_hz: m.carrier,
    phases: m.phases,
    hold_hz: m.hold,
    ramp_minutes: m.rampMin,
    duration_minutes: m.rampMin,
    loop_hours: maintenance ? 8 : 6,
    continuous_no_fade: maintenance,
    lufs,
    true_peak_dbtp: -1.0,
    lra_lu: maintenance ? 5 : (masking ? 7 : 9),
    carrier_below_bed_db: masking ? 12 : 16,
    notch: masking
      ? `1/2-oct cut at ${m.carrier - 50}–${m.carrier + 50} Hz (−6 dB)`
      : `1/3-oct cut at ${m.carrier - 20}–${m.carrier + 20} Hz (−4 dB)`,
    band: 'Theta → Delta',
    note: m.note
  };
}

/* ============================================================
   PUBLIC API
   ============================================================ */
function generateTrackSpecs({ tierId, shift, timing, disruptors, soundscape, countryName, customer }) {
  const slots = TIER_TRACKS[tierId] || TIER_TRACKS.sleep;

  return slots.map((slot, i) => {
    const S = TRACK_SLOTS[slot];
    const prompt = buildPrompt({ shift, timing, disruptors, soundscape, slot, countryName });
    const beat   = buildBeatParams({ shift, timing, disruptors, soundscape, slot });

    const mixNotes = (disruptors || [])
      .map(d => DISRUPTOR_MODULES[d] && DISRUPTOR_MODULES[d].mix)
      .filter(Boolean);

    return {
      track_slot: slot,
      track_index: i + 1,
      title: S.title,
      target_state: S.state,
      band: S.band,
      differentiator: S.differentiator,
      final_prompt: prompt,
      beat_params: beat,
      mix_notes: mixNotes,
      qa: [
        `FFT: L peak at ${beat.carrier_hz} ±0.1 Hz`,
        `Interaural difference matches schedule ±0.05 Hz at 5 checkpoints`,
        `Re-verify on 320 kbps forced-full-stereo MP3`,
        beat.continuous_no_fade
          ? 'Zero amplitude dips >1 dB across the full render; no fade at either end'
          : 'Loop seam <0.5 dB discontinuity',
        beat.carrier_below_bed_db === 12
          ? `Carrier SNR ≥6 dB in a 1 Hz bin at ${beat.carrier_hz} Hz`
          : null
      ].filter(Boolean)
    };
  });
}

module.exports = {
  generateTrackSpecs,
  TRACK_SLOTS,
  TIER_TRACKS,
  BEAT_MATRIX,
  PALETTE_MODULES,
  DISRUPTOR_MODULES
};
