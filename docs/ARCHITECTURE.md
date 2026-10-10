# Architecture

## Overview

The project is a static wedding website with Supabase as the backend and Vercel as the deployment platform.

### Public frontend

- `index.html` defines the public site, invitation cover, localized album overlay and lightbox.
- `i18n.js` handles VI / EN / JA text and route language behavior.
- `personalized.js` resolves invitation tokens and fills guest-specific UI.
- `invitation.js` controls the invitation opening sequence.
- `app.js` handles RSVP submission, wedding-event scroll state, gallery loading and public interactions.
- `particles.js` renders the fixed decorative particle layer after invitation opening.
- `public/countdown.js` owns the countdown timer independently of `app.js`.
- `motion/cursor.js` owns the pointer/cursor engine independently of `motion.js`.
- `motion.js` contains shared visual motion only; old guide/travel/detailed-schedule motion has been removed.
- `music.js` handles the wedding music dock.

The old standalone `album/` implementation was removed. Public album routes now reuse the same overlay experience from `index.html`:
- `/vi/album`
- `/en/album`
- `/jp/album`

### Admin

The `admin/` folder contains the authenticated wedding CMS.

Main areas:
- Overview dashboard
- Multilingual content
- RSVP
- Guest invites
- Album/gallery

Public album browsing is handled inside the main frontend (`index.html` + `app.js`). The old standalone `album/` implementation has been removed.

When an existing public gallery image is edited, the admin uploads it to a new Storage object path, updates `gallery_images.image_path`, then removes the old object. This avoids stale CDN/browser images.

### Backend

Supabase is used for:
- Postgres tables
- RLS policies
- Auth for admin
- Storage for wedding photos
- RPC functions for token-based invite access

### Cache strategy

Mutable HTML/CSS/JS routes are returned with `no-store` headers from Vercel.

Gallery and Hero image URLs are versioned with `updated_at`. Replacing an image also changes its Storage object path, so clients never need to reuse a stale image URL.

Safari/in-app-browser BFCache restores are detected through `pageshow`; persisted pages reload once to obtain current assets.

### Deployment

GitHub `main` → Vercel production.

## Important design rules

- The invitation cover content should stay visually stable during opening.
- The couple photo must not animate upward.
- The moving object is the inner invitation card emerging from the envelope.
- Wedding schedule scroll animation is owned by `app.js`; do not restore the deleted legacy detailed-schedule animation in `motion.js`.


## Cache strategy

- Customer HTML and mutable frontend assets are served with `Cache-Control: no-store` to avoid stale in-app browser/Safari layouts.
- Gallery/Hero image URLs include the database `updated_at` value as a version query.
- Replacing an image from Admin writes a new Storage object path instead of overwriting the previous public path.
- When a page is restored from Safari/iOS BFCache, the frontend reloads once so the current deployed UI is used.
- Album data cached in memory is invalidated after the page stays in the background for more than 60 seconds.

## Stylesheet layering (refactor branch)

The public page loads `css/site-01.css` through `css/site-09.css` in an explicitly preserved order, followed by `invitation-couture.css`. The original contiguous segments have now been cleaned of unused V3–V6 overrides and exact duplicate declarations; the current combined content is integrity-checked by `tools/check-site.mjs` using `css/manifest.json`.

`styles.css` remains as a compatibility shim for older direct references. Vercel applies no-store headers to `/css/:path*`, `/motion/cursor.js` and `/public/countdown.js`, consistent with existing mutable frontend assets.

The public site and CMS deliberately use separate CSS and JavaScript entry points; admin/auth/RLS behavior is unchanged in this refactor.

## Shared Admin utilities

The Admin page loads `admin/state.js` then `admin/utils.js` before Library, Editor, RSVP and Guest screens. The shared helpers provide CSV export, guest field normalization, latest RSVP-per-invitation lookup, WebP optimization and simple gallery metadata updates. Supabase auth, schema and the custom cover/hero image behaviors remain unchanged.
