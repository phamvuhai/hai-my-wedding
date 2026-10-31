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

## Current production implementation (V18)

The active public site is a single invitation rendered from `index.html`, with
localized entry points `/vi`, `/en`, `/jp`, and private invitation links.
**Do not delete a CSS/JS file merely because its name includes an older V-number:**
the production HTML still imports some V3–V12 layers to preserve the final cascade.

- **Invitation cover:** `invitation.js` and `invitation-simple.css`.
- **Wedding photography and story:** `wedding-v3.js`, `wedding-v11.css`,
  `wedding-v12.css`, and active preceding stylesheets.
- **Countdown:** `wedding-countdown-v15.css`; live countdown values remain in `app.js`.
- **Wedding gifts:** `wedding-gifts-v16.js/css`, edited through Admin.
- **Scroll motion:** `motion.js`, `wedding-v4.js/css`,
  `wedding-text-motion-v17.js/css`, `wedding-split-motion-v18.js/css`.
- **Admin Visual Editor:** `admin/visual-editor-v14.js/css` plus the live CMS modules.
- **Album and RSVP:** retained with multilingual text and personalized invite links.

## Removed prototypes and backups

Retired source code (Romantic Collage V2, Image Manager V13, Canvas/Atelier/Couture
opening) and obsolete Figma/Canvas storyboard exports have been removed from
`main` because they are no longer used by the current site.

The original design assets and code remain recoverable on GitHub branch
`backup/before-legacy-design-cleanup-20261031` (and earlier cleanup backup).
The editable Figma project is separate from production source.
Do not delete the active four-viewport invitation audit or WebKit smoke tests.

For the current admin workflow, see [docs/ADMIN.md](docs/ADMIN.md).
