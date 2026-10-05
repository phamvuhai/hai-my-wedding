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
