# Active asset map

Updated: 2026-10-31. This is the current source layout. Historical versions
remain recoverable from Git history and the existing backup branches.

## Entry points and styles

| Page | HTML | Active stylesheet |
| --- | --- | --- |
| Public website (VI / EN / JA) | `index.html` | `assets/css/site.css` |
| CMS | `admin/index.html` | `assets/css/admin.css` |
| CMS sign-in | `admin/login/index.html` | `assets/css/login.css` |
| CMS password recovery | `admin/reset-password/index.html` | `assets/css/login.css` |

The public CSS bundle is ordered **foundation → invitation cover → touch
effects → wedding sections → countdown → gift cards → scroll animations**.
The Admin bundle loads base dashboard CSS before editor feature overrides.
Avoid reordering these sections without visual regression tests.

## Public scripts (loaded in this order)

```text
assets/js/config.js
assets/js/site/i18n.js
assets/js/site/personalized.js
assets/js/site/app.js
assets/js/site/motion.js
assets/js/site/music.js
assets/js/site/particles.js
assets/js/site/invitation.js
assets/js/site/touch-effects.js
assets/js/site/wedding.js
assets/js/site/reveal.js
assets/js/site/album.js
assets/js/site/gifts.js
assets/js/site/scroll-motion.js
```

## Admin scripts (loaded in this order)

```text
assets/js/config.js
assets/js/admin/state.js
assets/js/admin/library.js
assets/js/admin/editor.js
assets/js/admin/content.js
assets/js/admin/rsvp.js
assets/js/admin/guests.js
assets/js/admin/dashboard.js
assets/js/admin/wedding.js
assets/js/admin/visual-editor.js
assets/js/admin/gifts.js
assets/js/admin/auth.js
```

The sign-in page loads `assets/js/config.js` and
`assets/js/admin/login.js`. The password recovery page loads
`assets/js/config.js` and `assets/js/admin/reset-password.js`.
Static decorations live in `assets/images/`.

## Cleanup and maintenance rules

- Name files by feature, without release suffixes (such as `-v15`).
- Keep JS files separate by workflow rather than merging global scripts
  blindly. All scripts currently use classic loading semantics.
- Keep CSS in one stylesheet per page entry, with labeled section boundaries
  and the original cascading declaration order.
- Do **not** rename versioned CSS selectors (such as `countdown-v15`),
  JavaScript data keys or Supabase columns without a tested migration. These
  identifiers are referenced at runtime even though versioned **filenames**
  have been removed.
- Do not remove `tools/audit-atelier.mjs`, `tools/audit-webkit.mjs` or
  `tools/audit-touch.mjs`: GitHub Actions still uses them.
- The database schema and stored images, invitations, bank details and RSVP
  records were not changed by this repository refactor.

## Verify before merging

Run `node tools/check-asset-refs.mjs` and `node tools/audit-password-recovery.mjs`, then the WebKit smoke workflow to test
the public invitation, localized pages, Admin editor, QR/bank info, gallery,
RSVP and mobile layout. Static checks do not replace browser/production tests.
