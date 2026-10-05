# Technical Memo

Last major update: 2026-10-05

## Production

- Repository: `phamvuhai/hai-my-wedding`
- Branch: `main`
- Production: `https://hai-my-wedding-gamma.vercel.app`
- Backend: Supabase
- Deployment: Vercel auto-deploy

## Current invitation behavior

- Personalized invite cover is enabled for invite routes.
- Mobile cover has a compact layout for <= 480px.
- Couple photo must stay fixed during opening.
- Envelope opens and reveals `.intro-inner-letter`.
- Welcome message can be dismissed by touch/click/swipe/scroll.
- Falling particles run from homepage to footer after opening.

## Current particle set

- 🌸 55%
- ✨ 25%
- ❤️ 10%
- ❄️ 10%

Do not restore 🤍 unless the visual direction changes.

## RSVP architecture

### Invite RSVP

Personalized invites use a server-side token RPC.

A guest may revisit the same invitation and change the response. The system updates the existing RSVP row using the invite relationship.

Key functions:
- `get_wedding_invite(text)`
- `mark_wedding_invite_opened(text)`
- `get_wedding_rsvp(text)`
- `submit_wedding_rsvp(...)`

### Public RSVP

Normal homepage submissions:
- `invite_id = null`
- `response_source = 'public'`

They are not automatically matched to invite records by name or phone.

### Database protection

A partial unique index on `rsvp(invite_id)` prevents duplicate personalized RSVP rows.

## Admin RSVP

Admin can:
- distinguish invite/public/admin sources
- filter by source
- edit a response in a modal
- export CSV

## Supabase security note

The invite-token RPCs are intentionally callable anonymously because possession of an active invitation token is the capability used to access the guest-specific invitation flow.

Keep the RPC payload narrow and never expose internal guest-list queries directly to anon.

## Known follow-up ideas

- Add an explicit admin workflow to link a public RSVP to a guest invite after manual review.
- Add admin-created RSVP records using `response_source = 'admin'`.
- Improve audit history if manual RSVP edits need traceability.


## 2026-10-04 admin/security + responsive update

- RSVP admin now supports Edit + Delete.
- Delete requires confirmation and only removes the RSVP row; the linked guest invite remains active.
- Supabase RLS grants RSVP DELETE only to the configured authenticated admin account.
- Admin login no longer exposes or calls the first-time account creation flow.
- Forgot-password / recovery remains available.
- Login errors use generic wording instead of revealing whether an account exists.
- Added mobile/layout regression guards for public site, admin tables/modals, and admin login.
- Added text sizing and overflow protections for narrow mobile webviews and multilingual copy.


## 2026-10-05 homepage, cache and cleanup update

### Current public flow

The customer-facing homepage is intentionally limited to:
- invitation cover
- Hero
- Story
- compact Countdown
- unified Wedding Events timeline
- FOREVER transition
- Album
- RSVP
- Footer

The old standalone Guide, Detailed Schedule, Travel, FAQ and Wishes sections are no longer part of the page.

### Wedding Events

- Bride and groom schedules are both visible.
- Personalized invitations highlight the invited day without hiding the other day.
- Timeline progress is continuous and follows real scroll position.
- Event emphasis and status text are controlled by `app.js`.
- Do not restore the removed `.schedule-day/.schedule-item` experience from old versions.

### Album

- Standalone `album/index.html`, `album/album.css` and `album/album.js` were removed.
- Localized album routes reuse the full-screen overlay from the main public app.
- Empty album filters are hidden.
- Homepage shows a focused preview instead of the full gallery.

### Cache rules

- Mutable public/admin HTML, CSS and JS are served with `no-store`.
- Safari/in-app-browser BFCache restores reload the page.
- Gallery/Hero URLs include `updated_at` as a version token.
- Editing an image rotates the public Supabase Storage path and removes the old public object only after the database update succeeds.
- Album data cached in memory is invalidated after the page has been in the background for more than one minute.

### Cleanup completed

Removed:
- legacy standalone album files
- obsolete `.vercel-redeploy`
- old detailed-schedule motion code
- Guide/Travel/Wishes/FAQ motion selectors
- unused translations for removed homepage sections
- several large legacy CSS blocks for old Guide/Schedule/Travel/Wishes layouts

Keep cleanup conservative when a CSS rule mixes active and legacy selectors; preserve active selectors first, then remove dead names in a separate verified change.
