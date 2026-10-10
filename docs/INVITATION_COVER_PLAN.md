# Luxury Romantic Invitation — Implementation Plan

## Objective
Replace the small, empty-looking invitation entry screen with a high-impact but lightweight wedding invitation experience, while preserving the established wedding site and guest features.

## Scope
- Entry cover at `/` and personalized `/{lang}/invite/{token}` only.
- Do not change the localized internal homepage, RSVP logic, Supabase APIs, admin, wedding schedule or gallery.

## Tasks
1. **Layout** — Create an elevated invitation paper panel occupying most of the viewport, with clear visual hierarchy and enough room for text on mobile.
2. **Visual** — Use ivory textured paper, deep burgundy ambience, fine champagne double rules, corner filigree and existing botanical SVG assets from `images/invitation/figma`.
3. **Motion** — Add gentle one-time arrival and barely perceptible sparkle; keep single-click opening and the existing quick hand-off to the homepage. Respect reduced-motion preferences.
4. **Responsive** — Tune landscape, smaller phones (375×667), common phones (390×844), tablets and desktop. Avoid clipping, horizontal overflow, and CTA below the fold.
5. **Compatibility** — Keep `data-i18n` content for Vietnamese/English/Japanese, `#personalInvitePrivate`, `#personalLinkNotice`, share button, personalized open/RSVP event and same `#openInvitation` ID.
6. **Quality assurance** — Browser screenshot and layout assertions, language-to-route behavior, localized route bypass, Safari/WebKit RSVP smoke.
7. **Release** — Review the feature branch, merge to `main`, verify latest Vercel production deployment is READY.

## Acceptance checks
- The invitation resembles a premium invitation rather than text floating on a blank background.
- Both full names, date, opening button and invite-specific recipient notices are legible.
- Opening preserves the guest token, starts homepage at the top and dispatches `wedding:invitation-opened`.
- No horizontal overflow; CTA can be tapped without scrolling on supported typical viewports.
- Three languages and existing RSVP integration remain unchanged.
