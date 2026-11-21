# Deployment

## Production

Production URL:

https://hai-my-wedding-gamma.vercel.app

## Git workflow

Default branch: `main`

The repository is connected to Vercel. Commits to `main` trigger automatic production builds.

## Cache behavior

The public site and admin use explicit `no-store` headers for mutable HTML, CSS and JavaScript. This is intentional because the site is edited frequently and is commonly opened inside Safari, Messenger and other in-app browsers.

Photo handling uses two additional cache-busting layers:
1. Public gallery and Hero URLs include the row `updated_at` value as a version query.
2. Editing an existing photo creates a new Supabase Storage object path before the database is updated; the previous public object is removed after a successful save.

The public app also reloads when Safari/in-app browsers restore a page from BFCache.

Do not change image editing back to overwriting the same Storage path unless another immutable/versioned delivery strategy replaces it.

## Before release

Run `node tools/check-asset-refs.mjs` before release. The GitHub Action
`Asset integrity` runs this check on pull requests and pushes to `main`.

Check:
1. `/`, `/vi`, `/en`, and `/jp` resolve.
2. Personalized invite routes open correctly.
3. Mobile invitation cover has no horizontal overflow.
4. Invitation opening does not move the couple photo.
5. Existing invite RSVP loads and updates instead of duplicating.
6. Public RSVP creates a separate public response.
7. Wedding timeline progress follows scroll continuously on mobile.
8. `/vi/album`, `/en/album`, and `/jp/album` use the unified album overlay.
9. Admin RSVP filters/edit actions work.
10. Editing an existing gallery/Hero image returns a new public image path.
11. Production HTML/CSS/JS responses carry `Cache-Control: no-store...`.
12. Particle layer is hidden before opening and subdued over information-heavy sections.

## Supabase

Production database changes should be applied as migrations.

The root `supabase.sql` file is a reference snapshot/documentation file and should be updated whenever the deployed schema changes.


## Cache / stale-content checks

Production deliberately disables caching for HTML and mutable CSS/JS through Vercel response headers. After a release, verify:

- `/`, `/vi`, `/en`, `/jp`, Album and Admin return `Cache-Control: no-store`.
- `assets/js/site/app.js` and `assets/css/site.css` return the same no-store policy.
- Hero/gallery image URLs change when an image record is edited.
- Editing an image from Admin creates a new public Storage path and removes the previous object after the database update succeeds.
- Restoring the site from iOS/Safari BFCache reloads the current deployment.

Do not reintroduce same-path Storage upserts for public wedding images; stale CDN/browser images can otherwise survive a deployment.

## Admin password recovery verification

1. Confirm `/admin/reset-password/` serves the dedicated Admin page (not the wedding site).
2. In Supabase → Authentication → URL Configuration, allow `https://hai-my-wedding-gamma.vercel.app/admin/reset-password/` as a Redirect URL.
3. In Authentication → Email Templates → Reset Password, use `{{ .ConfirmationURL }}` as the action link instead of `{{ .SiteURL }}`.
4. Request a reset from `/admin/login/` using the Admin account, open the email, and check that only a valid, unexpired recovery token reveals the new-password form.
5. Confirm updating the password signs out and redirects to `/admin/login/?reset=success`; check that the old password no longer works.
6. Verify `/`, `/vi`, `/en`, `/jp` and private invitation URLs still show the wedding normally. Do not use real tokens in CI.

## V19 romantic motion release (2026-11-21)

Reference-inspired but original additive effects, independent of the existing Admin and RSVP implementations:

- `assets/js/site/romantic-motion.js`: pointer-only parallax for Story paper and photo cards, plus a subtle champagne silk sheen on existing CTAs. Language switching may replace button inner text, so decorations are reattached after `wedding:language`.
- `assets/css/romantic-motion.css`: responsive crystal-heart SVG scene (between Promise and Memories), subtle depth and sheen. No WebGL, externally fetched animation library, or moving Hero image.
- `#weddingMagic`: visible without JavaScript as a static illustration. Particle animation pauses offscreen, when the invitation is closed, when the page is hidden, under `prefers-reduced-motion`, or when the CMS animation mode is `minimal`.
- Original links, RSVP submission, Supabase gallery records, existing Home gallery selection, personal invitation tokens, and the mobile scroll lock remain unchanged.

Verification: GitHub WebKit workflow runs `tools/audit-romantic-motion.mjs` offline, then existing Safari/iPhone and invitation touch regression. Also check VI/EN/JP titles, desktop hover/focus, small-screen overflow and reduced-motion behavior before production merge. No Supabase schema migration is necessary.

## V23 — Rose Gold Particle Heart (2026-11-21)

The existing **Our Promise → Crystal Heart → Album** placement is unchanged. V23 adds a short, original SVG/Canvas 2D transition **inside** the V19 Crystal Heart scene; there are no extra sections, external images, videos, libraries, storage rows or database migrations.

- **Draw (~1.8s)** — SVG path traced in a champagne/gold line with rose glow, using stroke dash offsets.
- **Particle burst (~1.45–3.75s)** — deterministic rose/blush/champagne sparks originate from the right-hand heart arc. Canvas 2D, 180 particles on desktop and 64 on narrow/touch devices. Limit to ~60fps desktop and ~30fps mobile; canvas resolution capped at 2× DPR.
- **Crystal reveal (~2.65–4.0s)** — the existing V19 facet heart fades in. After ~4.7s the frame loop stops entirely and the original subtle CSS dust/Crystal Heart remain.
- **Pause** — animation stops offscreen, when the invitation is locked, when a Lightbox or Album overlay is open, or when the tab is hidden. Reentering resumes from its previous position; it does not restart on every scroll or language change.
- **Accessibility** — Reduced Motion and CMS motion mode `minimal`/`off` show the original static crystal; the overlay is `aria-hidden` and `pointer-events:none`.
- **No external requests** — SVG path and particles are generated locally; no WebGL, third-party JavaScript, API or Supabase dependency.
- **QA** — offline WebKit smoke `node tools/audit-particle-heart.mjs` validates real Canvas pixels, SVG progress, pause/resume, budgets, and reduced-motion fallback. The existing V19, V21 and Admin tests continue running in CI.

Release only after GitHub CI and Vercel Preview are green, then squash-merge to the linked Production branch (`main`) and verify the Production deployment's exact commit/domain.


## V24 — Compact Luxury wedding responsive layout (2026-11-21)

**Goal:** a noticeably shorter, calmer invitation on PC/tablet/iPhone without removing
critical wedding event details, maps, RSVP, personalized invitations, Gallery, or V23
particle/Crystal Heart animations.

- Added a final CSS layer \`assets/css/compact-wedding.css\`: scope is the public
  wedding invitation only (not Admin). Stronger spacing hierarchy and smaller
  headings/cards across four responsive widths; photo Hero and Love Story remain
  the big emotional visual moments.
- Reduced redundant content in **VI/EN/JA** for Hero note, Story, Promise, Event
  intro, Gallery intro, RSVP intro, and Footer. Kept existing translations for
  family names, wedding dates/venues, address text, RSVP controls and errors.
- Countdown is a compact horizontal strip on desktop and one heading + one
  4-digit-row countdown on phones. The duplicate decorative date stamp and
  repetitive schedule tagline are *visually hidden*; the dates and schedule
  remain visible elsewhere.
- Simplified Event cards, Promise photo/letter, Album intro and RSVP spacing
  without changing any form fields, family schedule logic, event destinations,
  bank account values, or album imagery.
- Gift cards use **two parallel columns even on phones**, each with a compact
  QR preview. Tapping an actual QR opens an accessible \`<dialog>\` with the
  same authentic QR enlarged for scanning; Escape/close dismisses it.
  Account number Copy remains unchanged. Dynamic Supabase \`wedding_gifts_v1\`
  settings and public/private availability continue to control what is shown.
- **Important**: Production Bride gift account is currently disabled/unconfigured,
  so the Bride tile remains a *small truthful unavailable placeholder*; never
  publish a fabricated Bride bank, account, or QR image. Admin can enable Bride
  later and the parallel two-column view will show both real QRs automatically.
- No database migrations or changes to photo ordering, storage, RSVP, Hero
  focus, or the invitation's protected-personalization workflow.
- Gate Production on \`tools/audit-compact-wedding-v24.mjs\` running under WebKit
  at widths **340/390/768/1280**, including QR enlargement, Escape, copy
  behavior, 2-column alignment, missing Bride fallback and enabled Bride
  fixture, plus existing WebKit, asset integrity and visual regression CI.

### Mobile acceptance notes

QR shown at 93–126 CSS pixels in the two-up gift cards is for recognition;
a guest needing to scan must tap it to open the full-size 300px version. The
button has an accessible label and a minimum 42px copy target.
Keep descriptions and titles readable after switching to EN/JA.
