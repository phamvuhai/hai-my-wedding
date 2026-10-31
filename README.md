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

## Active story and image management

- Public storytelling uses **Wedding Editorial V3 / Story Builder**, driven by the `v3_design` configuration.
- **Admin → Thiết kế website** provides the active Visual Editor for Hero, Story, Schedule, Our Promise, Gallery, RSVP, wedding gifts and Farewell.
- Photos used only as website backgrounds can be excluded from the public Album via `show_in_album`.
- The old Romantic Collage V2 editor and runtime were retired. Historical `collage_layout` data is intentionally left untouched in Supabase.
- The invitation cover uses `invitation.js` and `invitation-simple.css`; the earlier Figma Canvas/Atelier JavaScript implementation was retired. Original design references are archived on a Git backup branch.

## Active source structure (V18 consolidated)

The current production website uses `index.html` for all VI/EN/JA routes.
Source files are grouped by responsibility; old version labels alone do **not**
mean that a script can be removed.

### Website CSS loading order

1. `styles.css` — shared base/responsive styles
2. `invitation-simple.css` — interactive invitation cover
3. `touch-effects.css` — touch feedback
4. `wedding-sections.css` — wedding layout, Hero, Story, Schedule, Promise and Gallery;
   merges twelve older visual CSS files while preserving the exact cascade
5. `wedding-countdown-v15.css` — live countdown presentation
6. `wedding-gifts-v16.css` — bank information cards
7. `wedding-scroll-motion.css` — V17/V18 scroll text and split animations

### Website JavaScript

- `config.js`, `i18n.js`, `personalized.js`, `app.js` — configuration,
  localization, private invitations, RSVP and public data
- `invitation.js`, `motion.js`, `music.js`, `particles.js`,
  `touch-effects.js` — invitation and presentation behavior
- `wedding-v3.js`, `wedding-v4.js`, `wedding-album-v12.js`,
  `wedding-gifts-v16.js` — current section, story, gallery and gift features
- `wedding-scroll-motion.js` — concatenated IIFE modules (V17 then V18);
  both still work independently, and execute after other website features

### Admin

- `admin/admin.css` — shared dashboard CSS
- `admin/editor-features.css` — design editor, visual previews, bank/QR settings
- Admin JavaScript modules remain separate by workflow (guest invites, RSVP,
  Album, visual editor, security/auth) to prevent global state and load-order regressions.

For the full active source map see [docs/ASSET_MAP.md](docs/ASSET_MAP.md).

## Removed prototypes and backups

Retired source code (Romantic Collage V2, Image Manager V13, Canvas/Atelier/Couture
opening) and obsolete Figma/Canvas storyboard exports have been removed from
`main` because they are no longer used by the current site.

The original design assets and code remain recoverable on GitHub branch
`backup/before-legacy-design-cleanup-20261031` (and earlier cleanup backup).
The editable Figma project is separate from production source.
Do not delete the active four-viewport invitation audit or WebKit smoke tests.

For the current admin workflow, see [docs/ADMIN.md](docs/ADMIN.md).
