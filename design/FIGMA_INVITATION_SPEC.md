# Figma Asset Pack Specification — Hải & Mỹ Wedding Opening

## 1. Purpose

This Figma file is the **visual source of truth** for the wedding invitation opening.
The website must render exported Figma artwork; Canvas is responsible only for composition,
clipping, timing, light effects, particles, and transitions.

Figma file:
- Name: **Hai & My Wedding Invitation — Canvas Opening Mockup**
- File key: `CIjp5ZYyRAK8mHqpLLOMaQ`
- URL: https://www.figma.com/design/CIjp5ZYyRAK8mHqpLLOMaQ
- Account: Hai Pham
- Team: Nhom 10's team

## 2. Master pages

### Page: Storyboard

Master reference frame: `2:2`

Contains:
- 6 opening states
- invitation card design
- Canvas component inventory
- event timeline
- responsive references
- palette and effect tokens

### Page: Assets

Asset pack frame: `3:2`

Every exported layer must keep transparency and must not include browser UI, labels, or annotations.

## 3. Color tokens

| Token | Value | Usage |
| --- | --- | --- |
| Burgundy | `#4B0E1A` | main envelope / deep red atmosphere |
| Dark Red | `#7A1E2D` | envelope highlight / roses |
| Ivory | `#FDF6ED` | invitation paper / lining |
| Gold | `#D4AF37` | piping / ornament / dust |
| Warm Brown | `#8B5E3C` | typography / paper warmth |
| Background | `#100205` | cinematic background |

## 4. Exported asset list

All runtime assets live under:

`/images/invitation/figma/`

### 4.1 Invitation card

**Figma node**
- Complete card: `3:5`
- Card shell: `3:6`

**Runtime file**
- `figma-card.svg`

**Design**
- Portrait ratio: 1600 × 2200 reference
- Warm ivory paper
- subtle paper grain
- two fine gold borders
- burgundy rose + gold leaves in upper-left
- smaller floral composition in lower-right
- no guest name baked into artwork
- core wedding typography is rendered by Canvas for sharpness and localization

**Text placement**
- H & M: 22% height
- PHẠM VŨ HẢI: 40%
- &: 46.5%
- NGUYỄN THỊ MỸ: 53%
- ornament: 59.5%
- 19 · 12 · 2026: 66.5%
- Wedding Invitation: 80%

## 5. Envelope assets

### 5.1 Back
- Figma node: `3:125`
- Runtime: `figma-envelope-back.svg`
- burgundy stationery texture
- subtle vignette and highlight
- gold edge

### 5.2 Front pocket
- Figma node: `3:131`
- Runtime: `figma-envelope-front.svg`
- V-shaped pocket
- must stay above card while card is inside envelope
- must preserve transparent area above V fold

### 5.3 Flap
- Figma node: `5:2`
- Runtime: `figma-envelope-flap.svg`
- exported as separate transparent layer
- hinge is the top envelope edge
- Canvas simulates perspective by vertical compression during the first half of flap animation

### 5.4 Inner lining
- Figma node: `3:170`
- Runtime: `figma-envelope-lining.svg`
- ivory / champagne
- low-contrast botanical pattern
- becomes visible only after flap crosses midpoint

## 6. Cord and seal

### Cord
- Figma node: `3:138`
- Runtime: `figma-cord.svg`
- champagne-gold
- crossing pattern centered on seal
- must remain transparent outside cord geometry

### Wax seal
- Figma node: `3:151`
- Runtime: `figma-wax-seal.svg`
- irregular wax silhouette
- burgundy wax
- champagne rim
- H·M center mark

Animation:
- tap response starts at 0.10
- cord loosen starts at 0.16
- seal moves slightly right/down while rotating ~8°
- cord opacity decreases as it loosens

## 7. Floral assets

### Back florals
- Left node: `3:183`
- Right node: `3:252`
- Runtime:
  - `figma-floral-left.svg`
  - `figma-floral-right.svg`

Visual:
- burgundy roses
- golden leaves
- thin warm-brown branches
- transparent background
- left cluster larger than right

Layer order:
1. background
2. bokeh / dust
3. back florals
4. envelope/card
5. foreground florals
6. petals

## 8. Petals / effects

Petals:
- `3:322` → `figma-petal-01.svg`
- `3:325` → `figma-petal-02.svg`

Effect reference:
- `3:341`

Canvas-generated effects:
- gold dust
- warm radial glow
- card light sweep
- bokeh
- subtle floor glow

These are deliberately generated at runtime to avoid large raster assets.

## 9. Animation storyboard

Total duration: **6200 ms**

| Stage | Progress | Event | Visual |
| --- | ---: | --- | --- |
| 01 | 0.00 | `invitation:tap` | closed envelope |
| 02 | 0.10 | `invitation:seal-open` | seal reacts/releases |
| cord | 0.16 | internal | cord loosens |
| 03 | 0.20 | `invitation:flap-open` | flap begins opening |
| flap done | 0.38 | internal | lining fully visible |
| 04 | 0.36 | `invitation:card-start` | card begins rising |
| clear | 0.68 | `invitation:card-clear` | card leaves pocket |
| 05 | 0.84 | `invitation:card-presented` | card settled + glow |
| 06 | 0.94 | `invitation:transition` | fade to website |
| end | 1.00 | `invitation:complete` | opening destroyed |

Keyframe debug mapping:
- 01 = 0.00
- 02 = 0.14
- 03 = 0.31
- 04 = 0.53
- 05 = 0.86
- 06 = 0.965

In browser console:
`WeddingInvitationCanvas.renderKeyframe('05')`

## 10. Motion rules

### Seal
- no bounce
- one short press/release
- translate right/down
- rotate gently

### Cord
- opacity and position loosen together
- no sudden disappearance

### Flap
- one continuous open
- no reverse/bounce
- transition from outer flap to inner lining at midpoint

### Card
- starts fully inside envelope
- front pocket masks card until `card-clear`
- scale 0.955 → 1.0
- rotation approximately -0.23° → 0°
- shadow increases as paper leaves envelope
- one light sweep after presentation

### Hero transition
- hold visual after presentation
- fade Canvas over final 6% of timeline
- destroy Canvas only after complete event

## 11. Responsive design

### Mobile (<760 px)
- envelope width: 90vw, max 450px
- card: 72% envelope width
- anchor Y: 51.5vh
- Canvas DPR capped at 1.5

### Tablet (760–1099 px)
- envelope: 64vw, max 575px
- card: 69%
- anchor Y: 50.5vh

### Desktop (>=1100 px)
- envelope: 45vw, max 610px
- card: 68%
- anchor Y: 50.5vh
- Canvas DPR capped at 2

## 12. HTML/CSS responsibilities

HTML retains only:
- language switcher
- Canvas
- accessible click/tap stage
- personalized notice
- CTA
- live status

CSS handles only:
- full-screen positioning
- CTA/language placement
- safe-area support
- accessibility focus
- Canvas/hero fade

CSS must not recreate:
- envelope
- flap
- card
- seal
- cord
- flowers

## 13. Git source structure

```
index.html
styles.css
invitation-assets.js
invitation-config.js
invitation-canvas.js
invitation.js

images/invitation/figma/
  figma-card.svg
  figma-envelope-back.svg
  figma-envelope-front.svg
  figma-envelope-flap.svg
  figma-envelope-lining.svg
  figma-cord.svg
  figma-wax-seal.svg
  figma-floral-left.svg
  figma-floral-right.svg
  figma-petal-01.svg
  figma-petal-02.svg
```

## 14. Acceptance checklist

Frame 01:
- closed envelope is the visual focus
- seal is centered
- florals frame the envelope
- CTA never covers envelope

Frame 03:
- flap is open
- lining is visible
- card has not jumped to foreground
- front pocket remains correct

Frame 05:
- card is fully clear
- card is foreground
- warm glow visible
- petals/dust are subtle
- card text is readable
- no flap overlaps card

Responsive:
- no card clipping
- no horizontal overflow
- iPhone safe area respected
- CTA remains below artwork
- language selector remains accessible

Performance:
- all artwork preloaded before opening is enabled
- Canvas destroyed after transition
- deterministic particle layout for visual consistency
