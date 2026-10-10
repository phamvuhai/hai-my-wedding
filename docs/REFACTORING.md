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

## Stage 2 — Cleanup completed on this branch

- Removed obsolete invitation V3–V6 CSS overrides and five exactly repeated style rules. The active HTML/CSS Couture invitation remains untouched.
- Further removed 71 unused `invite-v2`/Canvas CSS rules and 35 keyframes no longer referenced in the active CSS or JavaScript. Renamed the active stage class to `.couture-stage` to avoid legacy style collisions.
- Deleted unused pre-Couture `invitation-canvas.js`, `invitation-config.js`, `invitation-assets.js` and `invitation-simple.css` (not loaded by the public HTML).
- Removed redundant Gallery initialization calls in `motion.js`; existing data-init listener guards remain.
- Introduced `admin/utils.js` for export CSV, normalizing guests, getting the latest RSVP per invitation, gallery metadata changes, and WebP optimization.
- Updated Admin RSVP, Guests, Gallery and Image Editor to use shared helpers.
- Added `tests/admin-utils.test.mjs` to GitHub Actions.

## Stage 3 — Remaining work (requires browser, Supabase and visual regression testing)

- Audit additional scattered legacy selectors only after browser screenshot comparison on PC, tablet, Android and Safari iOS.
- Consolidate repeated responsive/important rules into maintainable design tokens and component styles.
- Segment the remaining public app into independently testable gallery, RSVP and event-scroll modules without changing Supabase calls.
- Add live integration tests for guest dedupe, RSVP edits, gallery upload and auth redirects; unit helpers are already covered.
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
node --test tests/invitation.test.mjs tests/admin-utils.test.mjs
```

No npm dependencies are required for the refactor checks.

## Latest measured reduction

Relative to `main`, the refactor branch has **2,263 fewer net CSS/JS lines** (+8,290 added, -10,553 deleted) and **1,794 fewer net lines in all changed files** (including tests and docs), as measured on 2026-10-10. Check the comparison again after additional commits.

Do not remove remaining generic `.invitation-intro` CSS just because it predates Couture: the active cover still uses that class. Any further cleanup needs a runtime selector audit and screenshots on iPhone, tablet and PC.
