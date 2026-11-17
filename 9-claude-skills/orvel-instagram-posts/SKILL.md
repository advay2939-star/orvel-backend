---
name: orvel-instagram-posts
description: "Use for any Orvel (orvelsound) Instagram grid post or carousel: writing post copy and captions, designing and rendering the images, and publishing them to @orvelsound."
---

# Orvel Instagram posts (skill 5 of 5)

Orvel makes personalised ambient sleep audio for shift workers, sold at orvelsound.com. The Instagram account is @orvelsound.

- **Audience:** night-shift nurses, long-haul drivers, warehouse night crews and other rotating-roster workers.
- **Markets:** US, UK, Canada and Australia.

This skill is part of the Orvel content system, alongside **orvel-reel-script**, **orvel-reel-frames**, **orvel-canva-edit** and **orvel-captions**. Reels use the same design system as posts.

**Cadence:** one piece a day, alternating between a reel one day and a grid post or carousel the next.

**CTA:** always point to orvelsound.com. The niche landing pages are not live yet.

## 1. Design system (locked 16 Sep 2026)

There are two themes on one shared layout. Never use gradients, haze, frosted glass, grain, pill chips or boxed cards. An earlier draft used them and was rejected as "too much going on".

| | Paper | Night |
|---|---|---|
| Background | #F5F0E4 | #141A2E |
| Headline and text | #1B1913 | #E9E8F6 |
| Muted | #6E6555 | #9BA1CB |
| Accent | #484DE5 | #AEB2F5 |
| Hairlines | #DCD2BC | #2E375C |

Layout, at 1080 × 1440 (3:4):
- **Top bar:** top-left mono label (JetBrains Mono 500, uppercase, tracking 0.18em, 17px). Top-right ORVEL wordmark (Cormorant Garamond 400, uppercase, tracking 0.24em, 26px).
- **Headline:** Cormorant Garamond 300, about 98–112px, line-height 1.04, left edge at 90px, top at 230px.
- **Detail:** one element only. Either a thin zigzag audio line (2px stroke), or text rows separated by hairlines (mono label on the left, DM Sans value on the right).
- **Footer:** `orvelsound.com` bottom-left (mono, lowercase). Slide count `1 / 3` bottom-right on carousels.
- **Carousels:** every slide uses the same theme as the cover.

**Grid rule: a checkerboard that starts with Paper.** Alternate Paper and Night in posting order. The grid is three columns, so alternating keeps the checkerboard however many posts are added.
- Launch posts 01–09 went Paper, Night, Paper … Paper.
- **Post 10 is Night**, and posts alternate from there.
- Check the latest live post's theme before choosing.
- Reels show in the grid too, so count them in the alternation.

Fonts are OFL-licensed and available from the google/fonts GitHub repo:
- CormorantGaramond[wght].ttf
- CormorantGaramond-Italic[wght].ttf
- DMSans[opsz,wght].ttf
- JetBrainsMono[wght].ttf

## 2. Content rules (claims)

- **Mechanism:** acoustic masking is the only mechanism Orvel claims. Describe it as "a steady floor makes the same noise a smaller jump".
- **Banned claims:** never mention entrainment, brainwaves, deep sleep, sleep improvement or guaranteed results.
- **No invented proof:** no testimonials, reviews, stars, customer counts or "most popular". Label the $99 tier "Recommended".
- **Examples:** label any example brief or roster as an example.
- **Driver content:** always include "For rest stops only. Never while driving."
- **Facts to keep in sync with the site:**
  - Sleep $69 (2 tracks), Full Day $99 (4), Complete $149 (5). One-time payment, no subscription required.
  - The brief is about 20 questions. Tracks are produced in 24–48h and delivered as MP3 + WAV.
  - One free rebuild within 14 days, and a full refund if the rebuild still misses.
  - Tracks: Morning, Focus, Afternoon Reset, Wind-down, Sleep.
- **Voice:** plain, specific, shift-work detail (school run, bin lorry, reefer hum, 3 × 12 roster). Short sentences. No hype.

## 3. Captions

Write captions, alt text and hashtags with the **orvel-captions** skill.

If that skill isn't available, build each caption from these parts, with a blank line between them:
1. A hook line that restates the headline.
2. A body of 1–2 short paragraphs.
3. An optional line for saving, tagging or swiping.
4. `Link in bio → orvelsound.com`
5. 4–5 hashtags, always ending in #orvelsound.

Keep list items (tracks, prices, steps) on consecutive single lines.

## 4. Rendering

The builder lives on Advay's Mac at `~/Desktop/Orvel/7-instagram/launch-01-final/source.zip`. It contains:
- `styles.py`: the layout functions. Use `style_quiet("A")` for Paper and `style_quiet("B")` for Night.
- `final.py`: the carousel slide builders and posting plan.
- `render_final.py`, `copy.json` and `fonts/`.

To render: `python3 final.py && python3 render_final.py`. This uses Playwright and Chromium, and outputs 1080 × 1440 PNGs.

For new posts, add the copy and a plan entry, render, then check every image visually. Look for overlaps, text crossing tile seams, and words split across panorama tiles.

Name files in posting order (`NN_slug.png`, plus `_slideN` for carousels). Save them to `~/Desktop/Orvel/7-instagram/<batch>/`, together with `CAPTIONS.txt` and a 3×3 `00_grid-preview.png`.

## 5. Publishing to @orvelsound

Only publish when Advay asks. Each Share goes live immediately.

**Browser:** use Chrome (the Claude in Chrome extension). The in-app browser can't attach files. Advay logs in himself; never type passwords. If more than one Chrome is connected, ask which one before acting.

For each post:
1. Open Create. The first click on the sidebar Create icon may only expand the sidebar, so click "Create" again.
2. Use `find` to locate the file input inside the "Create new post" dialog.
3. Upload with `file_upload`. The file must sit in the session's working directory (for example `/home/claude/...`). Paths under `/mnt/user-data/outputs` and Mac paths are rejected. For a carousel, pass all slides in one call, in order.
4. On the Crop screen, click the crop icon (bottom-left) and choose **Original**, so posts keep 3:4. Original applies to every slide in a carousel.
5. Click Next twice. Find the Next buttons by name, because the window size can change between steps.
6. Click the "Add a caption…" box and type the caption paragraph by paragraph. Press Return twice between paragraphs and once between list lines. Finish the hashtags with a trailing space.
7. Check the caption before sharing: read the text of the `[contenteditable="true"]` elements with JavaScript and compare it to the source.
8. Click Share. Wait 20–30s for the "Post shared" heading, then click Done.

**Profile edits:**
- The bio is under Settings → Edit Profile. Use `form_input` to keep the line breaks; typed Return keys are dropped. Then click Submit.
- The name is under Accounts Centre → Profiles → orvelsound → Name. It can only be changed twice in 14 days.
- The website link can only be edited in the mobile app.

**Grid display:** desktop instagram.com shows 4 columns. The checkerboard and panoramas are designed for the app's 3-column grid.

## 6. Audience growth (following)

Only run this when Advay asks.

**Source:** followers of close sleep-sound brands. Moongate (@moongate_app) has been used. Rotate the brand each round. `instagram.com/endel` is a musician, not the app; find handles through search, not the API.

**Who to follow:** people with more than 2 posts, a profile photo and a real name. Skip:
- shops, spas, salons, studios, realtors and other businesses
- bot patterns: following over 3,000 with under 300 followers, or usernames with long digit runs

Read each account's post count from its hover card in the followers dialog.

**Pace:** 5–9s between follows, run in small supervised batches of 1–2. Unattended background loops are blocked.

**Limits seen on this account:**
- Day 1: 53 follows went through.
- Day 2: follows stopped silently after 14 more (66 total). The Follow button stopped changing.
- The profile-info API returned 429 errors after a burst of lookups.

**Stop immediately** on any warning, a silent non-follow, or a 429. Then rest 24–48h, and keep the next round to about 30.

**Cleanup:** unfollow non-followers after 3–4 days.

## 7. Current profile (live)

- Name: `Orvel · Sleep for Shift Work`
- Bio: "Sleep sound, made to order for shift workers. / Tell us your roster and your room. We build your tracks. / One-time, from $69 ↓"
- Link: orvelsound.com
- Launch: posts 01–09 live since 16 Sep 2026.
