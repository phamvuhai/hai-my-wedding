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
- Admin password recovery through a dedicated verified reset page
- Admin RSVP editing and source filtering
- Guest invite management, sent/opened tracking and link generation
- Wedding gallery / album management
- Supabase-backed CMS content
- Responsive mobile invitation cover
- Vercel auto-deploy from `main`

## Architecture

```text
hai-my-wedding/
├── index.html                 # Public website and invitations
├── admin/
│   ├── index.html             # Wedding CMS
│   ├── login/index.html       # Admin sign-in
│   └── reset-password/index.html  # Admin password recovery
├── assets/
│   ├── css/
│   │   ├── site.css           # All public styles, cascade preserved
│   │   ├── admin.css          # Admin dashboard + editor styles
│   │   └── login.css          # Admin sign-in styles
│   ├── js/
│   │   ├── config.js          # Supabase public client configuration
│   │   ├── site/              # Public features and page animations
│   │   └── admin/             # CMS features, editor, authentication
│   └── images/                # Bundled static decorative assets
├── tools/                     # Visual and asset-integrity checks
├── docs/                      # Technical documentation
├── supabase.sql               # Reference schema
└── vercel.json                # Routes and cache policy
```

Styles are consolidated by entry point; JavaScript is grouped by responsibility.
All loaded script order and CSS cascade order from the previous website are preserved.
See [active asset map](docs/ASSET_MAP.md) for the exact entry points.

## RSVP model

There are three response sources:

- `invite` — submitted from a personalized invitation link
- `public` — submitted from the normal public website
- `admin` — reserved for records created/managed by admin workflows

Personalized RSVP records are uniquely linked by `invite_id`. Re-submitting the same invitation updates the same RSVP row instead of creating duplicates.

## Local development

Serve the repository with any static HTTP server. Opening `index.html` directly may work for simple UI checks, but a local server is recommended for routing and asset behavior.

## Supabase

Configuration is stored in `assets/js/config.js`.

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
- [Active source map](docs/ASSET_MAP.md)

## Active story and image management

- Public storytelling uses **Wedding Editorial V3 / Story Builder**, driven by the `v3_design` configuration.
- **Admin → Thiết kế website** provides the active Visual Editor for Hero, Story, Schedule, Our Promise, Gallery, RSVP, wedding gifts and Farewell.
- Photos used only as website backgrounds can be excluded from the public Album via `show_in_album`.
- The old Romantic Collage V2 editor and runtime were retired. Historical `collage_layout` data is intentionally left untouched in Supabase.
- The invitation cover uses `assets/js/site/invitation.js` and the invitation section of `assets/css/site.css`; the earlier Figma Canvas/Atelier JavaScript implementation was retired. Original design references are archived on a Git backup branch.

## Active source layout

The website loads a single public stylesheet, `assets/css/site.css`, followed
by its JavaScript files in the original initialization order. The CSS contains
labeled sections for foundations, cover, touch feedback, wedding sections,
countdown, gifts and scroll motion.

The Admin dashboard loads `assets/css/admin.css`, while the sign-in page
uses `assets/css/login.css`. Their JavaScript is kept in
`assets/js/admin/` as separate feature files to preserve execution order.

File names describe responsibility, not release number. **Versioned CSS
selectors, data attributes and database keys are intentionally retained**:
they are runtime hooks, not obsolete duplicate files.

Run `node tools/check-asset-refs.mjs` to validate local HTML/CSS references,
asset organization and the Vercel cache policy before pushing changes.
See [docs/ASSET_MAP.md](docs/ASSET_MAP.md) for file-by-file details.

## Removed prototypes and backups

Retired source code (Romantic Collage V2, Image Manager V13, Canvas/Atelier/Couture
opening) and obsolete Figma/Canvas storyboard exports have been removed from
`main` because they are no longer used by the current site.

The original design assets and code remain recoverable on GitHub branch
`backup/before-legacy-design-cleanup-20261031` (and earlier cleanup backup).
The editable Figma project is separate from production source.
Do not delete the active four-viewport invitation audit or WebKit smoke tests.

For the current admin workflow, see [docs/ADMIN.md](docs/ADMIN.md).
