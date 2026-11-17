# ORVEL — Canva Brand Kit setup

Every value below is lifted from `index.html` on the live site, not approximated.
Paste them into Canva → Brand → Brand Kit.

---

## 1. Logo

Upload from `01-logo/`:

| Slot | File |
|---|---|
| Primary | `orvel-lockup-horizontal-dark.svg` |
| Light backgrounds | `orvel-lockup-horizontal-light.svg` |
| Stacked | `orvel-lockup-stacked-dark.svg` / `-light.svg` |
| Icon only | `orvel-mark-navy-circle.svg` |
| Profile picture | `orvel-avatar-navy.svg` (1080×1080, safe under circle crop) |

If your plan won't take SVG, the identical PNGs are in `PNG/01-logo/`.

---

## 2. Colours

Create three palettes so the two worlds don't get mixed by accident.

**Palette: Light world**

| Hex | Name | Use |
|---|---|---|
| `#F5F0E4` | Paper | Primary light background |
| `#EFE8D8` | Paper 2 | Alternate panel |
| `#E4DAC3` | Sand | Dividers, hairlines |
| `#1B1913` | Ink | Primary text |
| `#6E6555` | Muted | Secondary text |
| `#514939` | Muted 2 | Small labels |

**Palette: Dark world**

| Hex | Name | Use |
|---|---|---|
| `#141A2E` | Navy | Primary dark background |
| `#1B2340` | Navy 2 | Raised surface |
| `#232C4E` | Navy 3 | Card |
| `#E9E8F6` | Navy Text | Text on navy |
| `#9BA1CB` | Navy Muted | Secondary text on navy |

**Palette: Accent**

| Hex | Name | Use |
|---|---|---|
| `#AEB2F5` | Periwinkle | The mark's ring. Primary accent on dark. |
| `#C8CAFF` | Periwinkle Soft | The S. Highlights. |
| `#484DE5` | Periwinkle Deep | The mark on light backgrounds. Sampled from the light logo. |
| `#04998A` | Teal | One action accent per composition. Never decorative. |
| `#C99B34` | Gold | Rare highlight only. |
| `#B93A34` | Error | Errors only |
| `#3C7F55` | OK | Confirmations only |

---

## 3. Fonts

Three families, in `00-fonts/`. All are SIL Open Font Licence, so uploading them to Canva is fine.

| Role | Family | Weight | Treatment |
|---|---|---|---|
| Heading | Cormorant Garamond | 300 | Tracking −0.012em, line-height 1.08 |
| Subheading | Cormorant Garamond | 400 | |
| Body | DM Sans | 300–700 | |
| Label / eyebrow | JetBrains Mono | 400–500 | UPPERCASE, tracking 0.13–0.24em |

Cormorant Garamond, DM Sans and JetBrains Mono are all in Canva's own library, so you can
select them directly instead of uploading. The variable `.ttf` files are included in case
you want the exact weights.

**The wordmark:** Cormorant Garamond 400, uppercase, letter-spacing 0.24em. Nothing else.

**Type ratio that makes it look like Orvel:** mono does most of the talking. On the site,
73 of 94 font rules are mono, 18 are serif, 3 are sans. Mono labels above a thin serif
headline is the house move. If a layout feels off-brand, it's usually because the mono
label is missing.

---

## 4. Non-negotiables

- The S is `#C8CAFF` only on navy. On paper it is `#484DE5`, the same colour as the ring.
  Never a two-tone mark on a light background.
- Minimum clear space around the mark is one ring radius.
- Ring stroke 3.2, S stroke 5.4, round caps, on a 100-unit grid. Every icon in this kit is
  drawn on the same grid at the same two weights, which is what makes them a set.
- One teal accent per composition. Two makes it a dashboard.
- Never place the wordmark without the 0.24em tracking. It collapses instantly.
