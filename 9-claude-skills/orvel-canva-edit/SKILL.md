---
name: orvel-canva-edit
description: Use to assemble an Orvel reel in Canva: timeline edit sheet, signature open, text overlays, waveform motion, audio levels and export specs, using the orvel-brand-canva assets.
---

# Orvel Canva edit (skill 3 of 5)

This skill takes the beat sheet from **orvel-reel-script** and the frames from **orvel-reel-frames**. It produces a step-by-step Canva edit sheet that Advay can follow, or that Claude can partly carry out with the Canva connector.

## Canvas and look

- **Canvas:** 1080 × 1920, 9:16 video design, 30 fps.
- **Style:** flat Paper/Night, the same system as the grid posts. No glass cards, gradients, haze or grain. The old `06-glass-cards` assets are retired.

| | Paper | Night |
|---|---|---|
| Background | #F5F0E4 | #141A2E |
| Text | #1B1913 | #E9E8F6 |
| Muted | #6E6555 | #9BA1CB |
| Accent | #484DE5 | #AEB2F5 |
| Hairlines | #DCD2BC | #2E375C |

**Type:**
- **Headline:** Cormorant Garamond 300, 84–96px, line-height 1.04, left-aligned at x = 90.
- **Label:** JetBrains Mono 500, uppercase, tracking 0.18em, 26px.
- **Subtitles:** DM Sans 500, 44px, max 2 lines, centred, in the lower-middle zone.
- **Wordmark:** Cormorant Garamond 400, uppercase, tracking 0.24em.

**Safe zones:** keep all text out of the top 220px, the bottom 420px and the right 120px. Headlines sit in the upper third, from y = 260 to 700.

## Signature open (every reel)

This makes an Orvel reel recognisable in the first second.

1. **0.0–0.3s:** the live hook clip is full-bleed, with the mono label fading in top-left (for example `FOR NIGHT-SHIFT NURSES`) and the small ORVEL wordmark top-right.
2. **0.3–4.5s:** the on-screen hook text types or fades in as the serif headline, upper third. A thin waveform line (2px) runs across y ≈ 1180 in the theme accent, animating left to right.
3. **At the cut to still 1:** the waveform line stays on screen and becomes the running motif. It is spiky during the Problem beat and flattens into a raised steady floor during the Mechanism beat.

## Canva assets (folder `orvel-brand-canva`)

| Folder | ID | Contents |
|---|---|---|
| 01-logo | FAHUr5Tzz98 | Wordmarks and marks. Use `orvel-wordmark-ink` on Paper and `orvel-wordmark-paper` or `-navytext` on Night. |
| 02-waveforms | FAHUrxylotw | Mirror, envelope and rail waveforms per track. Use ink or peri variants only. |
| 03-binaural | FAHUr9-WADc | Do not use in reels (binaural is not a claimed mechanism). |
| 04-headphones | FAHUr7Td-9Y | Line headphones and the listener figure, for explainer beats. |
| 05-scans-hud | FAHUrxmyo4o | `scan-masking-floor` (the Mechanism beat) and `hud-roster-clock` (roster beats). |
| 07-reel-templates | FAHUrzEip7w | Safe-area guide, progress rail and end card. Check that a template is flat before using it. |

The brand kit is `kAHUry_KRf8`. Fonts are available in Canva's library.

## Timeline rules

- **Holds:** each still holds 3–6s with one motion (slow push-in 100→108%, or 3D parallax). Never stack motions.
- **Transitions:** straight cuts or 6-frame dissolves. No whooshes, spins or glitch effects.
- **Beat text:** each beat gets at most one on-screen line of 7 words or fewer, taken from the beat sheet, plus subtitles.
- **Progress rail:** a thin accent line across the bottom safe edge, running 0→100% over the reel.
- **End card (last 3–4s):**
  - theme background
  - wordmark, centred
  - serif line "Sleep sound, made to order."
  - `orvelsound.com` in mono
  - driver reels also show "For rest stops only. Never while driving."

## Audio

- **Voiceover:** the ElevenLabs file from the script is the master track. Normalise it to about −14 LUFS integrated.
- **Bed audio:** Google Flow exports always land at −14.00 LUFS, so treat the level as a fixed gain offset. Set the bed about 12–15 dB under the voiceover, and duck it a further 3 dB during speech.
- **Hook clip audio:** keep a real sound only if it is the "spike" (a door slam, a siren) and the script uses it. Otherwise mute it.
- **No music tracks.** The bed audio is the only sound under the voice.

## Output format

```
REEL: <title>   Theme: <Paper|Night>   Length: <s>s
Assets needed: hook clip (<tool>), F01–Fnn, VO.mp3, bed.wav, Canva: <asset names>

| Time | Layer | Asset | Text | Motion / transition | Notes |
|------|-------|-------|------|---------------------|-------|
| 0:00–0:05 | Video | hook.mp4 | "..." (serif, y 300) | fade in label + wordmark | waveform starts |
...
| 0:62–0:66 | End card | theme bg + wordmark | Sleep sound, made to order. / orvelsound.com | 6f dissolve in | |

AUDIO: VO −14 LUFS · bed −12 to −15 dB under VO, duck −3 dB · hook SFX: <keep/mute>
EXPORT: MP4, 1080×1920, 30fps, high quality → ~/Desktop/Orvel/8-reels/<NN_slug>.mp4
QA: text inside safe zones · no glass/gradient · subtitles match VO · claim check passed
```

Then pass the finished reel and its beat sheet to **orvel-captions**.
