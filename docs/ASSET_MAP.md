# Active assets and cleanup rules

Updated: 2026-10-31. This inventory describes source usage on `main` after the
consolidation. It is not an archive of older versions.

## Public page: `index.html`

| Order | CSS asset | Role |
| --- | --- | --- |
| 1 | `/styles.css` | Site-wide layout, shared tokens and responsive rules |
| 2 | `/invitation-simple.css` | Current wedding opening card |
| 3 | `/touch-effects.css` | Mobile touch feedback |
| 4 | `/wedding-sections.css` | Hero, Story, Event, Promise, Gallery and previous V3–V12 cascade |
| 5 | `/wedding-countdown-v15.css` | Countdown |
| 6 | `/wedding-gifts-v16.css` | Wedding bank/QR cards |
| 7 | `/wedding-scroll-motion.css` | Scroll typography + split convergence |

**The order is deliberate.** The consolidated CSS contains boundary comments
for each previous stylesheet; the original order and declarations are retained.

Public JavaScript files, in order:

```text
config.js
i18n.js
personalized.js
app.js
motion.js
music.js
particles.js
invitation.js
touch-effects.js
wedding-v3.js
wedding-v4.js
wedding-album-v12.js
wedding-gifts-v16.js
wedding-scroll-motion.js
```

The new `wedding-scroll-motion.js` contains two isolated self-invoking
modules in the original V17 → V18 execution order. Do not merge unrelated
workflow scripts unless their global state and initialization order are tested.

## Admin: `admin/index.html`

CSS order:

```text
admin/admin.css
admin/editor-features.css
```

Admin JavaScript files are independently loaded for access control, image
library, settings, RSVP, guests, visual editing and gift management.
`admin/login/index.html` has its own login-specific CSS and JS.

## Removed old runtime files

The originals of these stylesheets are now embedded in their corresponding
bundle and deleted as separate assets:

- `wedding-v3.css`, `wedding-poster.css`, `wedding-v4.css`,
  `wedding-v5.css`, `wedding-v6.css`, `wedding-promise.css`,
  `wedding-schedule-v7.css`, `wedding-editorial-v8.css`,
  `wedding-album-v9.css`, `wedding-refinement-v10.css`,
  `wedding-v11.css`, `wedding-v12.css`
- `wedding-text-motion-v17.css`, `wedding-split-motion-v18.css`
- `wedding-text-motion-v17.js`, `wedding-split-motion-v18.js`
- `admin/wedding-v3.css`, `admin/wedding-v11.css`,
  `admin/visual-editor-v14.css`, `admin/wedding-gifts-v16.css`

Older removed prototypes (Collage V2, Canvas/Atelier/Couture opening,
Image Manager V13, and old Figma exports) were deleted in the previous cleanup.

## Retained on purpose

- `wedding-v3.js`, `wedding-v4.js`, `wedding-album-v12.js`,
  `wedding-gifts-v16.js`, and their Admin counterparts are **active**.
- `wedding-countdown-v15.css` and `wedding-gifts-v16.css` are **active**
  purpose-specific styles, not abandoned versions.
- `tools/audit-atelier.mjs`, `tools/audit-webkit.mjs`, and
  `tools/audit-touch.mjs` are still invoked from GitHub Actions workflows.
- `supabase.sql` provides historical schema context; database tables and
  stored guest/QR/photo records were not modified.

## Recovery

Cleanup snapshots are on
`backup/before-legacy-design-cleanup-20261031` and
`backup/pre-cleanup-v18-20261031`; the original bundle input files are also
available in Git history before this consolidation.

When editing a bundle, maintain its section boundary comments and the order
of cascading declarations. Perform language, screen-size, invitation opening,
RSVP, Album and QR regression checks before production deployment.
