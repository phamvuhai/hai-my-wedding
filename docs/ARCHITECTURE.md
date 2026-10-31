# Architecture

## Overview

The project is a static wedding website with Supabase as the backend and Vercel as the deployment platform.

### Public frontend

- `index.html` defines the public site, invitation cover, localized album overlay and lightbox.
- `assets/js/site/i18n.js` handles VI / EN / JA text and route language behavior.
- `assets/js/site/personalized.js` resolves invitation tokens and fills guest-specific UI.
- `assets/js/site/invitation.js` controls the invitation opening sequence.
- `assets/js/site/app.js` handles RSVP submission, wedding-event scroll state, gallery loading and public interactions.
- `assets/js/site/particles.js` renders the fixed decorative particle layer after invitation opening.
- `assets/js/site/motion.js` contains shared visual motion only; old guide/travel/detailed-schedule motion has been removed.
- `assets/js/site/music.js` handles the wedding music dock.

The old standalone `album/` implementation was removed. Public album routes now reuse the same overlay experience from `index.html`:
- `/vi/album`
- `/en/album`
- `/jp/album`

### Admin

The `admin/` folder contains authenticated CMS HTML routes; its scripts live in `assets/js/admin/` and its styles in `assets/css/admin.css`.

Main areas:
- Overview dashboard
- Multilingual content
- RSVP
- Guest invites
- Album/gallery

Public album browsing is handled inside the main frontend (`index.html` + `assets/js/site/app.js`). The old standalone `album/` implementation has been removed.

When an existing public gallery image is edited, the admin uploads it to a new Storage object path, updates `gallery_images.image_path`, then removes the old object. This avoids stale CDN/browser images.

### Backend

Supabase is used for:
- Postgres tables
- RLS policies
- Auth for admin
- Storage for wedding photos
- RPC functions for token-based invite access

### Cache strategy

Mutable HTML routes and files under `/assets/` are returned with `no-store` headers from Vercel.

Gallery and Hero image URLs are versioned with `updated_at`. Replacing an image also changes its Storage object path, so clients never need to reuse a stale image URL.

Safari/in-app-browser BFCache restores are detected through `pageshow`; persisted pages reload once to obtain current assets.

### Deployment

GitHub `main` → Vercel production.

## Important design rules

- The current cover uses `invite-luxury` and `assets/css/site.css`; the retired
  Canvas/Atelier/Couture opening is not a production dependency.
- The invitation cover content should remain legible and stable while opening.
- Keep the Hero photo and fitted calligraphy stable across VI/EN/JP and mobile layouts.
- Current event schedule layout uses V7 cards and `assets/js/site/wedding.js`.
- Shared animation exists in `assets/js/site/motion.js` and `assets/js/site/scroll-motion.js`, with typography and
  split convergence layers; keep each component's transform owner explicit.
- Original Figma/Canvas reference exports were archived on
  `backup/before-legacy-design-cleanup-20261031`, not served by production.
