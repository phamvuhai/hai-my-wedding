# Wedding Invitation Opening — Figma Asset Pack Spec

## Source of truth
Figma file: https://www.figma.com/design/CIjp5ZYyRAK8mHqpLLOMaQ
Storyboard master node: 2:2
Asset pack node: 3:2

## Required asset names
- figma-card.svg
- figma-envelope-back.svg
- figma-envelope-front.svg
- figma-envelope-flap.svg
- figma-envelope-lining.svg
- figma-cord.svg
- figma-wax-seal.svg
- figma-floral-left.svg
- figma-floral-right.svg
- figma-petal-01.svg
- figma-petal-02.svg

## Canvas layer order
1. burgundy background / vignette
2. bokeh / back gold dust
3. back floral left / right
4. envelope back
5. lining / rear flap
6. invitation card while clipped inside envelope
7. envelope front pocket
8. cord
9. wax seal
10. invitation card after card-clear
11. foreground florals
12. petals / light sweep
13. transition overlay

## Timeline
- 0.00 invitation:tap
- 0.10 invitation:seal-open
- 0.20 invitation:flap-open
- 0.36 invitation:card-start
- 0.68 invitation:card-clear
- 0.84 invitation:card-presented
- 0.94 invitation:transition
- 1.00 invitation:complete

Total duration: 6200 ms.

## Responsive geometry
- Mobile <=760: envelope ~90vw, max 450px; card 72% of envelope
- Tablet 761–1099: envelope ~64vw, max 575px; card 69%
- Desktop >=1100: envelope ~45vw, max 610px; card 68%
- DPR cap: mobile 1.5; desktop 2
- Final card top must respect safe-area / Dynamic Island

## Motion rules
- Card scale only 0.95 -> 1.00
- Rotation stays under +/-0.5 degree
- No bounce
- No repeated scale/rotate cycles
- Seal and cord release progressively
- Card must remain clipped behind the front pocket until card-clear
- Hold presented card briefly before Hero handoff

## Visual QA
Frame 01: envelope closed; seal/cord centered; no card visible.
Frame 03: flap open; ivory lining visible; card not rising yet.
Frame 05: card fully clear; glow and petals visible; envelope visually recedes.

## Export rules
- vectors: SVG, keep viewBox
- isolated layers: transparent background
- raster blur/light only if necessary: WebP/PNG
- no outer whitespace around seal or petals
- asset names must match invitation-assets.js

## Implementation contract
- index.html: canvas + language + heading + accessible tap target/button only
- styles.css: opening layout/UI only, no stationery geometry
- invitation-assets.js: asset mapping only
- invitation-config.js: colors, responsive geometry, timing, typography positions
- invitation-canvas.js: preload, render layers, timeline, events, destroy
- any future visual redesign must be done in Figma first, then assets synced to Git
