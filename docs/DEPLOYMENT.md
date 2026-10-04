# Deployment

## Production

Production URL:

https://hai-my-wedding-gamma.vercel.app

## Git workflow

Default branch: `main`

The repository is connected to Vercel. Commits to `main` trigger automatic production builds.

## Before release

Check:
1. Personalized invite route opens correctly.
2. Mobile invitation cover has no horizontal overflow.
3. Invitation opening does not move the couple photo.
4. Existing invite RSVP loads and updates instead of duplicating.
5. Public RSVP creates a separate public response.
6. Admin RSVP filters and edit modal work.
7. VI / EN / JP routes still resolve.
8. Particle layer is hidden before opening and visible afterward.

## Supabase

Production database changes should be applied as migrations.

The root `supabase.sql` file is a reference snapshot/documentation file and should be updated whenever the deployed schema changes.
