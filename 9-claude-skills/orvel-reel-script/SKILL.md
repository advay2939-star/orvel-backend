---
name: orvel-reel-script
description: Use to research angles and write voiceover scripts for Orvel (orvelsound) Instagram reels and ads: hooks, 1000-character ElevenLabs scripts, beat sheets and bed-audio briefs per shift-work niche.
---

# Orvel reel script (skill 1 of 5)

This is the first skill in the Orvel content system. The chain runs:

1. **orvel-reel-script** (this skill)
2. **orvel-reel-frames**
3. **orvel-canva-edit**
4. **orvel-captions**

Grid posts and carousels use **orvel-instagram-posts**.

Every skill in the system depends on this one, so the beat sheet it outputs is the contract the later skills build from.

**Cadence:** one piece a day, alternating between a reel one day and a grid post or carousel the next.

## Product facts

Orvel makes personalised ambient sleep audio for shift workers (orvelsound.com, @orvelsound).

- The customer answers a brief of about 20 questions: roster, bedroom, what wakes them, sounds they can stand.
- A producer builds their tracks within 24–48h.
- Tracks are delivered as MP3 + WAV, and the customer keeps them.
- Tiers:
  - Sleep $69 (2 tracks)
  - Full Day $99 (4 tracks)
  - Complete $149 (5 tracks)
- One-time payment, no subscription required.
- One free rebuild within 14 days, and a full refund if the rebuild still misses.
- Tracks: Morning, Focus, Afternoon Reset, Wind-down, Sleep.

**Audience:** night-shift nurses, long-haul drivers, warehouse night crews and other rotating-roster workers.

**Markets:** US, UK, Canada, Australia. Write in plain international English and avoid region-only slang unless the niche calls for it.

## Claim rules (hard)

- **Mechanism:** acoustic masking is the only mechanism you may claim. Explain it as "a quiet room turns every door into a spike; a steady floor makes the same door a smaller jump".
- **Banned claims:**
  - entrainment, brainwaves, frequencies that "tune your brain"
  - deep sleep, sleep improvement, better or faster sleep promises
  - medical conditions (tinnitus, insomnia, ADHD) as things Orvel treats
  - any number of minutes to fall asleep
- **No invented proof:** no testimonials, reviews, customer counts, "thousands of nurses" or "most popular".
- **Drivers:** audio is for rest stops and the sleeper cab only. Never show or suggest listening while driving, and include "For rest stops only" in driver scripts.
- If a line would need evidence you don't have, cut it.

## Step 1: Pick the angle (research)

1. Read the project doc `claude/meta-ad-library-competitor-swipe-2026-09-01.md`. Its findings:
   - Nobody in the category advertises personalisation, so that angle is open to Orvel.
   - The long-running winners use time-of-life hooks, not science claims.
   - Anti-playlist positioning works for competitors.
2. When asked for trend research, search the web for current shift-work pain points in the chosen niche (Reddit, TikTok and nursing or trucking forums). Pull concrete details: roster patterns, noises, times.
3. Choose one niche per script: nurse, driver, warehouse, or general shift work. Then choose one angle:
   - **The jump** (masking mechanism)
   - **Built for you, not a playlist** (personalisation)
   - **Your day starts at 7pm** (identity)
   - **The brief** (how it works)
   - **What gets through** (the specific noise)

## Step 2: The hook (first 4–5 seconds)

- The first 4–5 seconds are a live video hook. The goal is about 60% retention through 5–6s.
- The spoken hook line is 12 words or fewer, starts mid-action, and has no greeting.
- The on-screen hook text is 7 words or fewer, and it doesn't have to match the voiceover word for word.
- Describe the hook visual in one sentence that **orvel-reel-frames** can turn into a video prompt. Example: "Nurse in scrubs pulls blackout blind at 9am; street noise leaks in."
- Hook patterns that fit Orvel:
  - **specific time:** "It's 9:14am and the bin lorry just woke you."
  - **contradiction:** "It isn't the noise that wakes you."
  - **identity:** "If your shift ends when the school run starts…"
  - **object reveal:** headphones on, blind down

## Step 3: Write the voiceover

- **Hard cap: 1,000 characters including spaces.** Always report the character count.
- Target 60–70 seconds voiced on ElevenLabs.
- **Voice:** Advay's own custom ElevenLabs voice. Don't choose or suggest a voice.
- Structure the script in five beats:
  1. **Hook**, 0–5s
  2. **Problem**, about 5–20s: concrete shift-work detail
  3. **Mechanism**, about 20–35s: the jump vs the floor
  4. **Product**, about 35–55s: brief → build → files
  5. **CTA**, the last 5–10s
- **CTA:** every script ends with one. Use "Start your brief at orvelsound.com". The niche landing pages (/nurse, /driver, /warehouse) are not live, so always point to the homepage until Advay says they are.
- **Tone:** plain, short sentences, specific detail. Use connectors ("so", "which means") and contrast ("most sleep sounds are one track for everyone; this one is built from your answers").
- **Anti-slop, instant fail:**
  - "In this video", "let's dive in", "game-changer"
  - three-word loops ("Fast. Easy. Effective.")
  - rhetorical Q&A lists
  - hype adjectives
  - "imagine…" set-ups
- **ElevenLabs formatting:**
  - Write numbers as they should be spoken ("nine fourteen a.m.", "sixty-nine dollars").
  - Spell out abbreviations.
  - Use commas and full stops for pauses, and ellipses sparingly.
  - No emojis and no hashtags in the voiceover.

## Step 4: Bed-audio brief

Each reel gets its own bed audio, matched to the reel type and the niche.

Write a 2–3 line brief for Google Flow covering:
- the texture (for example soft rain, low cab rumble, fan hum)
- "steady, no melody, no pitched pads, no rhythm, no voices"
- the level, sitting under the voiceover

Keep binaural terms out of reel beds. Customer audio uses the separate **orvel-customer-audio** skill.

## Output format

```
REEL: <working title>
Niche: <nurse | driver | warehouse | general>   Angle: <angle>   Theme: <Paper | Night>
Hook tool: <Higgsfield | Veo 3 | either>
VO characters: <n>/1000   Est. length: <s>s

| # | Time | Beat | Voiceover | On-screen text (≤7 words) | Visual (one sentence) |
|---|------|------|-----------|---------------------------|-----------------------|
| 1 | 0:00–0:05 | Hook | ... | ... | LIVE HOOK: ... |
| 2 | ... | Problem | ... | ... | STILL: ... |
...
| n | ... | CTA | Start your brief at orvelsound.com. | orvelsound.com | END CARD |

FULL VO (paste into ElevenLabs, custom voice):
<script>

BED AUDIO BRIEF:
<2–3 lines>

CLAIM CHECK: <one line confirming masking only, no banned claims, driver line if relevant>
```

**Theme:** use Paper (#F5F0E4) or Night (#141A2E) to match the grid. Reels count in the grid's Paper/Night alternation, so check the theme of the last live item.

Hand the table to **orvel-reel-frames**.
