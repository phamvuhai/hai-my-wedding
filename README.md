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
