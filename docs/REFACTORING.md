# Website refactoring roadmap

## Scope and safety

This project serves guests and administrators. A complete one-shot rewrite would risk invitation tokens, RSVP data, image uploads, admin auth, and iOS animation regressions. Refactor in reviewed, behavior-preserving stages; **do not merge based on a successful Vercel build alone**.

## Stage 1 — Completed on the refactor branch

- Split the 269 KB `styles.css` cascade into nine ordered files under `css/`; preserve byte-for-byte declarations and cascade ordering through `css/manifest.json`.
- Keep `styles.css` as a compatibility shim for legacy page links.
- Extract the 19 KB cinematic cursor engine into `motion/cursor.js` while preserving `motion.js` initialization.
- Extract countdown logic into `public/countdown.js` before the public app.
- Preserve admin and public script order, personalized invitation hooks, and all existing routes.
- Add dependency-free JS syntax / asset / route / CSS-cascade checks and invitation interaction tests, executed by GitHub Actions.
- Preserve Vercel no-store policies for new mutable assets.

## Stage 2 — Follow-up cleanup (not yet changed)

- Remove old `invite-v2` / Canvas-specific CSS only after screenshot comparison on PC, tablet, Android and Safari iOS.
- Archive or delete the unused older invitation implementation (`invitation-canvas.js`, `invitation-config.js`, `invitation-assets.js`, `invitation-simple.css`) once design-source references are migrated.
- Consolidate repeated responsive/important rules into maintainable design tokens and component styles.
- Segment the remaining public app into independently testable gallery, RSVP and event-scroll modules without changing Supabase calls.
- Extract reusable admin image/CSV helpers and add tests for guest dedupe, RSVP edits, gallery upload and auth redirects.
- Prefer content-driven layout and accessible transitions over fixed-pixel positioning.

## Required regression checks before production

1. Opening the invitation from `/` and personalized routes on iOS Safari and Android Chrome, including reduced motion.
2. `/vi`, `/en`, `/jp`, all localized album routes, Admin login and `/admin` redirect.
3. Personalized guest name and correct RSVP prefill; second submission updates the same invite RSVP.
4. Public RSVP creates a public response and admin edits do not unintentionally modify invite records.
5. Album images, lightbox and CMS image update (new Storage path / cache bust).
6. Desktop, tablet, small-phone, landscape and high-DPR screenshot comparison.
7. Production static assets return HTTP 200 and mutable HTML/CSS/JS are `no-store`.
8. No keyboard focus traps, horizontal overflow, or excessive animation under Reduced Motion.

## Preview deployment blocker observed

The Vercel preview for the refactor branch reports `READY` but direct requests to the preview URL currently return HTTP 404, including static assets. A successful static build does **not** prove that the preview is serving the site. Investigate Vercel preview routing, deployment protection or project configuration before merging into `main`; do not assume this is fixed by refactoring code.

## Test commands

```bash
node tools/check-site.mjs
node --test tests/invitation.test.mjs
```

No npm dependencies are required for the refactor checks.
