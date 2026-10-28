# Hải & Mỹ Wedding Website

Wedding invitation website for **Hải Phạm & Mỹ Nguyễn**, built as a static frontend with Supabase for data/auth/storage and Vercel for production deployment.

Production: https://hai-my-wedding-gamma.vercel.app

## Main features

- Multilingual public site: Vietnamese / English / Japanese
- Personalized invitation links: `/{lang}/invite/{token}`
- Minimal invitation cover with a single open button and quick fade
- Personalized welcome message after opening
- Site-wide wedding particles: 🌸 ✨ ❤️ ❄️
- RSVP form with public and invite-based response flows
- Invite RSVP upsert: reopening the same invite updates the existing response
- Admin RSVP editing and source filtering
- Guest invite management, sent/opened tracking and link generation
- Wedding gallery / album management
- Supabase-backed CMS content
- Responsive mobile invitation cover
- Vercel auto-deploy from `main`

## Architecture

- `index.html` — public wedding site
- `app.js` — RSVP, gallery and public page behavior
- `personalized.js` — personalized invite loading, prefill, welcome and open tracking
- `invitation.js` — invitation-cover opening flow
- `particles.js` — global wedding particle system
- `motion.js` — page motion effects
- `music.js` — wedding music controls
- `admin/` — authenticated wedding CMS
- `supabase.sql` — reference schema/policies/functions
- `docs/` — technical documentation and project memo

## RSVP model

There are three response sources:

- `invite` — submitted from a personalized invitation link
- `public` — submitted from the normal public website
- `admin` — reserved for records created/managed by admin workflows

Personalized RSVP records are uniquely linked by `invite_id`. Re-submitting the same invitation updates the same RSVP row instead of creating duplicates.

## Local development

Serve the repository with any static HTTP server. Opening `index.html` directly may work for simple UI checks, but a local server is recommended for routing and asset behavior.

## Supabase

Configuration is stored in `config.js`.

The production project currently uses the schema documented in `supabase.sql`. Database changes should be applied through migrations, not by editing production data manually.

## Deployment

The repository is connected to Vercel. Pushes to `main` trigger a production deployment automatically.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Admin](docs/ADMIN.md)
- [Animations](docs/ANIMATIONS.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Personalized invitations](docs/PERSONALIZED_INVITES.md)
- [Technical memo](docs/MEMO.md)

## Romantic Collage invitation

- The interior invitation includes five optional photo interludes after Story, Countdown, Events, Gallery and RSVP.
- By default, up to seven already-published homepage photos appear in a curated Romantic Collage arrangement; the layout remains empty if no images exist.
- Admin → **Collage thiệp** uses published Album images and saves the ordered layout as JSON to `site_content` with key `collage_layout` (no database migration).
- Admin supports Polaroid, film-frame, full-width, caption in VI/EN/JA, hide/show, reorder (drag or buttons), edit, remove and explicit Publish.
- Album uploads, storage, guest invites and RSVP behavior remain unchanged. Only already-published gallery images render publicly.
- To intentionally hide all collage photos, remove the entries and Publish an empty list. To add new photos, upload and Publish them in Admin → Album first.

## Wedding Editorial V3 (2026-10-28)

- Hero: one to three published photos with 7-second crossfade, pause and manual controls; reduced-motion support. Uses existing Hero as fallback.
- Wedding Schedule: shared couple photo above two compact columns (Bride left, Groom right), with preserved four event times, addresses, and map links; mobile toggle honors personalized invite priority.
- Photo storytelling: multilingual Split / Letter / Filmstrip / Quote blocks across five existing invitation interludes, with an optional farewell image.
- Admin → **Thiết kế V3**: edit Hero choices, autoplay, schedule / farewell photos and ordered multilingual story blocks; one Publish stores JSON in existing `site_content` key `v3_design`. No schema migration or guest/RSVP changes.
- Gallery images must already be published in Album. Missing or unpublished photos never render publicly. Legacy Collage V2 configuration remains stored and unchanged but V3 rendering supersedes it.

### Cinematic Wedding Poster (V3.1)

- Hero uses the same 1–3 published wedding photos in two perfectly synchronized layers: a blurred, burgundy-tinted full-bleed backdrop behind legible names, and an optional sharp portrait in front.
- Desktop: left-aligned type with right portrait; phones: centered type, portrait and an accessible schedule button. Focus crop is independently editable for desktop and mobile.
- Admin → Thiết kế V3 now includes blur (8/14/20px), backdrop tint (40/55/70%), sharp-photo toggle, desktop/mobile focus sliders and live previews. Existing v3_design JSON values are backwards-compatible.
- Reduced-motion users and hidden tabs never auto-cycle; slideshow pauses while the invitation cover is locked. RSVP, personalized guests and event mappings are not modified.

### Wedding Cinematic Triptych (V3.2)

- Hero restores original UTM Beautiful Caps calligraphic names and reuses the name-fitting script, now refitting when the poster grid mounts.
- Up to three DISTINCT published images appear simultaneously in an animated overlapping triptych; the prominent center photo and background rotate together every seven seconds. One photo centers; two form a centered pair, with no blank frames. Pause and manual dots remain functional.
- No database schema changes; images continue to be selected in Admin → Thiết kế V3. Mobile has an independent focus crop and compact photo stack.

## Wedding V4 — Our Forever Story

- Seven interlude chapters (five image compositions and two quotes) tell the wedding story in VI/EN/JA. Saved V3 Admin blocks take precedence if published.
- Background auto-crossfades, remains non-interactive and no public-facing photo picker/lightbox is shown. Blur defaults to 6px, tint to 40%. Published image URLs remain technically accessible; hiding the UI is not access control.
- Scroll reveal slides in from alternating sides; map links pulse subtly to invite a click; reduced-motion mode is respected.
- Full Hero, Story, Countdown, Event, Gallery, RSVP and Thank You copy updated across languages, with matching legacy site_content overrides to be synchronized.


## Wedding V5 — Full-bleed desktop and mobile hero

- Removes the boxed/overlapping Hero triptych entirely. The existing legacy `#heroImage` is retained hidden for older loading logic.
- Desktop uses 3–4 full-height edge-to-edge photographic columns behind centered wedding typography. If the admin chooses only one image, its crops repeat across 4 columns; 2 images alternate. Tablet uses 2–3 columns. Mobile uses one full-screen image, never repeated.
- The background automatically crossfades between available photos every 7 seconds; there are no picker, lightbox, or clickable image controls. Original published photo URLs are still public, which is independent of the visible UI.
- All ten localized narrative content keys and the four original wedding-event map destinations are retained. Two new VI/EN/JA photo chapters were added after the schedule and near the memories section; Admin default Story Builder is synchronized.
- Desktop editorial sections use wider landscape photographs, increased spacing, and a roomier two-column schedule. Mobile keeps its separate layout and event-day selector.
