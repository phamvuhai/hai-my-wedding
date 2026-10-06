# Wedding Invitation Figma Source

Editable Figma source for the Canvas wedding invitation opening.

## Figma

- File: **Hai & My Wedding Invitation — Canvas Opening Mockup**
- URL: https://www.figma.com/design/CIjp5ZYyRAK8mHqpLLOMaQ
- Account: Hai Pham
- Team: Nhom 10's team

## Pages

### Storyboard

Master editable mockup that recreates the supplied reference:

- 6 opening animation stages
- invitation card design
- Canvas component inventory
- event timeline
- responsive previews
- color/effect palette

Master node: `2:2`

### Assets

Reusable editable layers for implementation:

- invitation card
- envelope back/front
- open envelope / lining
- cord
- wax seal
- floral left/right
- petals
- gold dust / light effects

Asset pack node: `3:2`

See `invitation-figma-manifest.json` for exact node IDs.

## Canvas timeline

```
0.00 invitation:tap
0.10 invitation:seal-open
0.20 invitation:flap-open
0.36 invitation:card-start
0.68 invitation:card-clear
0.84 invitation:card-presented
0.94 invitation:transition
1.00 invitation:complete
```

## Implementation rule

The Figma file is the visual source of truth. Website Canvas code should use exported artwork/layers from this Figma file instead of recreating the stationery with new procedural SVG geometry.
