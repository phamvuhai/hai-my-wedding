# Deployment

## Production

Production URL:

https://hai-my-wedding-gamma.vercel.app

## Git workflow

Default branch: `main`

The repository is connected to Vercel. Commits to `main` trigger automatic production builds.

## Cache behavior

The public site and admin use explicit `no-store` headers for mutable HTML, CSS and JavaScript. This is intentional because the site is edited frequently and is commonly opened inside Safari, Messenger and other in-app browsers.

Photo handling uses two additional cache-busting layers:
1. Public gallery and Hero URLs include the row `updated_at` value as a version query.
2. Editing an existing photo creates a new Supabase Storage object path before the database is updated; the previous public object is removed after a successful save.

The public app also reloads when Safari/in-app browsers restore a page from BFCache.

Do not change image editing back to overwriting the same Storage path unless another immutable/versioned delivery strategy replaces it.

## Before release

Check:
1. `/`, `/vi`, `/en`, and `/jp` resolve.
2. Personalized invite routes open correctly.
3. Mobile invitation cover has no horizontal overflow.
4. Invitation opening does not move the couple photo.
5. Existing invite RSVP loads and updates instead of duplicating.
6. Public RSVP creates a separate public response.
7. Wedding timeline progress follows scroll continuously on mobile.
8. `/vi/album`, `/en/album`, and `/jp/album` use the unified album overlay.
9. Admin RSVP filters/edit actions work.
10. Editing an existing gallery/Hero image returns a new public image path.
11. Production HTML/CSS/JS responses carry `Cache-Control: no-store...`.
12. Particle layer is hidden before opening and subdued over information-heavy sections.

## Supabase

Production database changes should be applied as migrations.

The root `supabase.sql` file is a reference snapshot/documentation file and should be updated whenever the deployed schema changes.
