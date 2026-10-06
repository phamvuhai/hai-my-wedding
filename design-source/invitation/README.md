# Wedding Invitation — Source Design Pack

This source pack is reconstructed directly from the approved storyboard image supplied for the Hải & Mỹ wedding opening.

## Canonical visual reference

`reference/storyboard.webp` is the canonical source-of-truth image for the visual direction.

The six files in `keyframes/` are pixel-derived crops of the six storyboard states, upscaled without redesigning their composition:

1. Closed burgundy envelope
2. Seal release
3. Open flap / ivory lining
4. Invitation card rise
5. Card fully presented
6. Hero transition

## Layer references

The files in `layers/` are extracted from the "Các thành phần Canvas" and "Thiết kế thiệp" areas of the same approved storyboard. Dark panel backgrounds were keyed to transparency where appropriate.

- `card-artwork.webp` — large invitation-card artwork reference
- `card-mini.webp` — small card component reference
- `envelope-closed.webp` — envelope reference
- `lining.webp` — inner-lining reference
- `seal-cord.webp` — wax seal + cord reference
- `floral.webp` — floral decoration reference
- `petal.webp` — foreground petal reference
- `gold-dust.webp` — gold particle reference
- `light-flare.webp` — champagne light reference

## Color palette

- Burgundy: #4B0E1A
- Dark Red: #7A1E2D
- Ivory: #FDF6ED
- Gold: #D4AF37
- Warm Brown: #8B5E3C

## Animation timeline

- 0.00 invitation:tap
- 0.10 invitation:seal-open
- 0.20 invitation:flap-open
- 0.36 invitation:card-start
- 0.68 invitation:card-clear
- 0.84 invitation:card-presented
- 0.94 invitation:transition
- 1.00 invitation:complete

For exact storyboard matching, prefer the keyframe artwork as the visual truth. Do not replace the florals/envelope/card with procedural SVG approximations unless explicitly intended.
