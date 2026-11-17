---
name: orvel-reel-frames
description: Use to turn an Orvel reel beat sheet into generation prompts: live hook prompts for Higgsfield and Veo 3, and 9:16 still-frame prompts for Nano Banana Pro in Google Flow, with character continuity.
---

# Orvel reel frames and video prompts (skill 2 of 5)

This skill takes the beat sheet from **orvel-reel-script** and outputs every prompt needed to generate the reel's visuals. The finished frames go to **orvel-canva-edit**.

## Visual system (matches the posts, locked 16 Sep 2026)

- **Look:** flat and calm. No glassmorphism, gradients, haze, grain or boxed UI anywhere. Text is never generated inside images; it's added in Canva.
- **Two themes per reel.** Pick the one the script specifies:
  - **Paper:** a warm off-white plain wall close to #F5F0E4, soft daylight, muted warm tones.
  - **Night:** a deep navy room close to #141A2E, low practical light (a lamp or a streetlight through blinds), with cool periwinkle highlights close to #AEB2F5.
- **Composition:** keep the upper third clean for the serif headline. The environmental wide shot (T1) gives the cleanest upper third. Keep subjects in the middle and lower thirds, clear of Instagram's UI zones (top 220px, bottom 420px, right 120px at 1080 × 1920).
- **Continuity:** one human figure per reel, with the same face, hair and clothing in every frame. Keep the same background wall and the same light direction throughout.
- **Casting by niche:**
  - **nurse:** scrubs, lanyard, blackout blind, bedroom in daytime
  - **driver:** sleeper cab bunk, curtains, parked truck at a rest stop. Never driving while wearing headphones.
  - **warehouse:** hi-vis vest, rotating-roster calendar, daylight leaking round a blind
- **Props:** over-ear headphones are the recurring object. Show no brand logos, no phone screens with UI, and no clocks showing impossible times.
- **Subjects:** realistic adults, with diverse casting across reels.

## Live hook (first 4–5 seconds)

- **Goal:** about 60% retention through 5–6s. The motion must read in the first second: a blind pulled, headphones put on, eyes opening at a noise.
- Write **both** versions every time; Advay picks one per reel.
- **Higgsfield:**
  - one-sentence subject and action
  - a camera motion preset (for example slow push-in, handheld subtle)
  - duration 4–5s, 9:16
  - lighting and theme colour
- **Veo 3 (in Google Flow):** natural-language shot description covering:
  - subject, action and setting
  - camera and lens (for example "slow dolly-in, 35mm")
  - lighting and colour
  - "no on-screen text, no music"
  - ambient sound only if the edit needs it (for example a door slam)
  - duration 4–5s, vertical 9:16
- Match the hook's last frame to still 1: the same subject, clothing and background.

## Still frames (Nano Banana Pro in Google Flow)

- Generate at 9:16. Native output is 768 × 1376, upscaled to 1080 × 1920.
- Write one prompt per beat, and 2 frames per beat when the beat runs longer than 8s.
- **Prompt order:**
  1. subject (with the continuity descriptor)
  2. action
  3. setting, naming the plain wall as the active setting ("a plain warm off-white wall fills the background"). Name what should be there rather than listing what should be absent.
  4. shot type (T1 environmental wide, T2 medium, T3 detail)
  5. lighting
  6. colour palette
  7. "clean empty upper third for text"
- **Reference chaining.** The plain edit box drifts identity, so for every frame after the first:
  1. Click the "+" asset picker.
  2. Search the previous frame by its auto-generated title.
  3. Click Add to Prompt.
  4. Start the prompt with "Use the attached image as the exact character reference."
- **Negative block:** aesthetics only, and short: "no text, no watermark, no logos, no extra people, no distorted hands". Long negative prompts trip Flow's policy filter. Claim safety is handled in the script, not here.

## Output format

```
REEL: <title>   Theme: <Paper|Night>   Character: <one-line continuity descriptor>

HOOK — Higgsfield
Prompt: ...
Motion preset: ...   Duration: 4–5s   Aspect: 9:16

HOOK — Veo 3
Prompt: ...

FRAMES
| ID | Beat | Hold (s) | Shot | Prompt | Reference | Motion in Canva |
|----|------|----------|------|--------|-----------|-----------------|
| F01 | Problem | 5 | T1 | ... | hook last frame | slow push-in |
| F02 | ... | ... | ... | ... | F01 | parallax L→R |
...
Negative block (all frames): ...
```

**Motion in Canva** is a hint for the next skill: slow push-in, 3D parallax, or a hold. Keep one motion per frame.

Hand the frame table and the beat sheet to **orvel-canva-edit**.
