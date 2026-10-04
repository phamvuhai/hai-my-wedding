# Architecture

## Overview

The project is a static wedding website with Supabase as the backend and Vercel as the deployment platform.

### Public frontend

- `index.html` defines the public site and invitation cover.
- `i18n.js` handles VI / EN / JA text and route language behavior.
- `personalized.js` resolves invitation tokens and fills guest-specific UI.
- `invitation.js` controls the invitation opening sequence.
- `app.js` handles RSVP submission, gallery loading and public interactions.
- `particles.js` renders a fixed decorative particle layer after invitation opening.
- `motion.js` contains general animation behavior.
- `music.js` handles the wedding music dock.

### Admin

The `admin/` folder contains the authenticated wedding CMS.

Main areas:
- Overview dashboard
- Multilingual content
- RSVP
- Guest invites
- Album/gallery

### Backend

Supabase is used for:
- Postgres tables
- RLS policies
- Auth for admin
- Storage for wedding photos
- RPC functions for token-based invite access

### Deployment

GitHub `main` → Vercel production.

## Important design rule

The invitation cover content should stay visually stable during opening. The couple photo must not animate upward. The moving object is the inner invitation card emerging from the envelope.
