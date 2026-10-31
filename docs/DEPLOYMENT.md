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

Run `node tools/check-asset-refs.mjs` before release. The GitHub Action
`Asset integrity` runs this check on pull requests and pushes to `main`.

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


## Cache / stale-content checks

Production deliberately disables caching for HTML and mutable CSS/JS through Vercel response headers. After a release, verify:

- `/`, `/vi`, `/en`, `/jp`, Album and Admin return `Cache-Control: no-store`.
- `assets/js/site/app.js` and `assets/css/site.css` return the same no-store policy.
- Hero/gallery image URLs change when an image record is edited.
- Editing an image from Admin creates a new public Storage path and removes the previous object after the database update succeeds.
- Restoring the site from iOS/Safari BFCache reloads the current deployment.

Do not reintroduce same-path Storage upserts for public wedding images; stale CDN/browser images can otherwise survive a deployment.

## Admin password recovery verification

1. Confirm `/admin/reset-password/` serves the dedicated Admin page (not the wedding site).
2. In Supabase → Authentication → URL Configuration, allow `https://hai-my-wedding-gamma.vercel.app/admin/reset-password/` as a Redirect URL.
3. In Authentication → Email Templates → Reset Password, use `{{ .ConfirmationURL }}` as the action link instead of `{{ .SiteURL }}`.
4. Request a reset from `/admin/login/` using the Admin account, open the email, and check that only a valid, unexpired recovery token reveals the new-password form.
5. Confirm updating the password signs out and redirects to `/admin/login/?reset=success`; check that the old password no longer works.
6. Verify `/`, `/vi`, `/en`, `/jp` and private invitation URLs still show the wedding normally. Do not use real tokens in CI.
