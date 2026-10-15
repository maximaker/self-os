# SELF.OS — Style guide extracted from the "Soft Object" references

## 1. Character

**Emotional resonance.** Calm, clinical, quietly playful. It feels like a household object made of porcelain: white, matte and pleasant to hold, with one warm ember of color glowing in it. Nothing shouts. The interface sits on the page like a product on a gallery plinth.

**Core vibe.** It is *soft-industrial minimalism*. Dieter Rams-style restraint meets neumorphic tactility. Every screen is one "instrument" (weather, news, music, calendar). Each one has a single hero object (a disc, a vinyl record, a date bubble) in the middle of a sea of off-white.

**Identity markers (non-negotiable):**
1. **Ghost spine label.** A huge, ultra-light, embossed word (WEATHER F., NEWS, MUSIC, CALENDAR) runs vertically up the left third, rotated -90°. It is almost invisible and visible only through a white highlight and grey shadow (debossed).
2. **The corner BACK notch.** A black (or accent orange) quarter-disc sits in the bottom-right corner, cut out by the device radius, with a curved-arrow icon and the tiny caps label "BACK".
3. **Black capsule header.** A pill-shaped, near-black stadium contains the title in light white type. The secondary line sits under it in smaller type.
4. **One hot dot.** A single saturated orange/red circle marks "now" (the current day, the sun, the play state). It is always a circle and always the brightest thing on screen.
5. **Floating paper cards.** Small white tiles with a 2–4px radius, lifted by a long, soft, offset shadow. They read like paper slips laid on the surface.

## 2. Color palette

| Token | Hex | Role |
|---|---|---|
| `--porcelain` | `#F4F4F2` | App surface (warm off-white) |
| `--paper` | `#FFFFFF` | Cards, raised tiles |
| `--fog` | `#E6E6E3` | Hairlines, recessed wells, ghost-label shadow |
| `--ink` | `#262626` | Capsules, corner notch, discs, primary text |
| `--graphite` | `#6B6B6B` | Secondary text, meta |
| `--ember` | `#F26B2A` | Primary accent: "now", sun, active state |
| `--signal` | `#E63B2E` | Highlighted date, urgent |
| `--tide` | `#2E8BA6` | Secondary accent: audio/data bars, water, focus |
| `--sky` | `#9CC7E4` | Illustration fills (rain, ice) |

**Ratio.** About 85% porcelain/paper, 10% ink, 5% accent. Never put two accents next to each other at equal weight.

**Gradients.** Only on spherical objects: a radial gradient from `#FF8A4C` to `#F26B2A` to `#D9531A`, with a highlight at the top-left (the orange "button" in the weather disc). The ink disc uses `#3a3a3a` to `#1c1c1c`, radial.

## 3. Typography

- **Family.** Roboto (Light 300, Regular 400, Medium 500). It is a neutral Android grotesk, and the references are clearly Roboto.
- **Display.** 56px / 300 / -1px tracking. Used for temperature, big numbers and the timer.
- **Title.** 22px / 300 inside capsules, in white.
- **Body.** 13–14px / 400 in ink, line-height 1.35.
- **Meta.** 10–11px / 400 in graphite, often abbreviated ("Lun., 13", "Mié.").
- **Micro caps.** 8–9px / 500 / +0.18em tracking, uppercase ("BACK", "WEEKLY CALENDAR").
- **Ghost label.** 64–80px / 300 / +0.08em, uppercase, color = surface, `text-shadow: 1px 1px 1px #fff, -1px -1px 1px #d8d8d5`.
- Headline accents are letter-spaced in ember (e.g. "January , 2023"). Note the quirky space before the comma, which belongs to the voice.

## 4. Geometry & shapes

- **Circles.** Hero discs, the hot dot, avatar pins and day bubbles.
- **Stadiums (pills).** Headers and the progress track.
- **Near-square tiles.** 2–6px radius, small (about 64–90px) and floating.
- **Device radius.** 44px. The UI acknowledges it: the corner notch is clipped by it.
- **Masks.** A circular image is masked over a larger ink half-disc (calendar: igloo circle overlapping the black disc). Overlap is the key compositional move. Shapes intersect; they never just sit side by side.

## 5. Layers, overlay & transparency

The stack from bottom to top:
1. Surface (with an optional 2–3% linen/noise texture)
2. Ghost label (debossed)
3. Large ink shapes (half-disc, capsule)
4. Image masks overlapping the ink
5. Paper cards with long shadows
6. Hot dot / interactive accents
7. Corner notch (always topmost and fixed)

There is almost no alpha transparency. Depth comes from shadows, not glass.

**Shadows:**
- Card: `0 10px 24px -8px rgba(0,0,0,.12), 0 2px 4px rgba(0,0,0,.04)`
- Raised button: `6px 6px 14px #d9d9d6, -6px -6px 14px #fff`
- Pressed/inset: `inset 3px 3px 6px #dcdcd9, inset -3px -3px 6px #fff`

## 6. Layout & rhythm

- The layout is asymmetric. Content clusters center-right and the ghost spine owns the left. The diagonal flow runs from the header (top-left) to the hero (center) to the tile row (bottom-right), ending at the BACK notch.
- **Spacing scale.** 4 / 8 / 12 / 16 / 24 / 32 / 48. Generous air: density is low, around 3–5 elements per viewport cluster.
- **Tile rows step.** Tiles are offset vertically in a staircase (Lun 13 low, Mar 14 middle, Mié 15 high). This gives the layout its rhythm.
- **Lists use scale falloff.** In the calendar wheel, items shrink and fade with distance from the selected item (10 → 11 → 12 → **13** → 14 → 15 → 16).

## 7. Imagery & iconography

- **Imagery.** Imagery is used sparingly. One image per screen at most, cropped into a circle or a rounded rectangle with a 3px ink border. Illustrations are friendly, flat-ish cartoon or 3D.
- **Icons.** 1.5px stroke, rounded caps, 16–20px, in ink or ember. They are tiny, functional and sit inside cards or notches. Weather glyphs use the ember dot with tide droplets.
- **Data viz.** Data is drawn as stacked tide-blue rounded dashes (an equalizer) or as a hairline timeline with ring nodes (ember).

## 8. UI synthesis

| Element | Spec |
|---|---|
| Primary button | Ink capsule, 44px tall, white 13/400 label, ember dot at the left |
| Secondary button | Paper square tile, 56px, raised shadow, ink glyph; pressed = inset |
| Hero control | 180px ink disc + 72px ember sphere; press = scale .94 |
| Card | Paper, 4px radius, 12–14px padding, long shadow, meta above, body below |
| Tab/nav | Corner notch (BACK) + home grid of tiles; no bottom tab bar |
| Input | Recessed well (inset shadow), 4px radius, graphite placeholder |
| Toggle/check | 18px circle: fog ring, filling to ember when done |
| Progress | 2px fog hairline with an ink knob and ember fill |
| Motion | Slow ease (`power3.out`, 0.6–0.9s). Elements drift in from the right, as if sliding on a table. The hero disc rotates gently (vinyl). |
