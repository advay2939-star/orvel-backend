# ORVEL brand asset library

Everything here was drawn from scratch on the mark's own 100-unit grid, at the mark's own
two stroke weights (3.2 and 5.4). Colours are the exact hexes from `index.html`.

Every asset exists twice: **SVG** in the numbered folders, and an identical **PNG** with
transparency under `PNG/`. Use the SVGs if your Canva plan accepts them; otherwise use the PNGs.

| Folder | What's in it |
|---|---|
| `00-fonts/` | Cormorant Garamond, DM Sans, JetBrains Mono — variable TTFs, OFL licensed |
| `01-logo/` | Marks, wordmarks, horizontal and stacked lockups, avatars — 26 files |
| `02-waveforms/` | Bars, mirrored, envelope, radial, rail — for 7 audio sources × 6 colours |
| `03-binaural/` | Two-tone carrier pairs, L/R split, interference rings, frequency ladder |
| `04-headphones/` | Over-ear line/solid/thin/in-ring/with-waves, listener figure |
| `05-scans-hud/` | Spectrogram, frequency sweep, scan lines, corner frames, masking floor, roster clock |
| `06-glass-cards/` | Glassmorphism panels, PNG with the frost baked in — dark, navy, light, teal |
| `07-reel-templates/` | 1080×1920 safe-area guide, hook plate, caption bar, progress rail, end card, scrims, canvases |
| `brand-board.png` | One-sheet reference — palette, type, mark rules, waveform |
| `ORVEL-BRAND-KIT.md` | Exact values to paste into Canva Brand Hub |
| `waveform-data.json` | The raw 180-bin arrays behind every waveform asset |

## About the waveforms

Two of them (`subsurface`, `deepsub`) are the real RMS arrays measured from your shipped
WAV files — the same data the site's player draws. The other five are generated from each
track's locked spec: a broadband masking bed shaped by the band, amplitude-modulated at the
stated beat frequency, measured in 180 bins, then run through the site's own normalisation
(linear RMS → x^0.62 → peak 100). That's why Sleep at 2.5 Hz and Morning at 40 Hz visibly
differ, and why they sit in the same visual family as the two measured ones.

They are illustrations of the signal, not measurements of a person. Nothing in this kit
depicts a physiological response.

## A note on two assets

`scan-masking-floor-*` draws a raised broadband floor swallowing intrusive events. That is
the mechanism you can actually defend, so it's the diagram worth using when a reel needs to
show *why* it works.

`hud-roster-clock-*` is a 24-hour ring with a night shift marked. It maps to a real
questionnaire input. It was drawn instead of a hypnogram deliberately — a sleep-stage graph
would imply a measurement Orvel doesn't take.
