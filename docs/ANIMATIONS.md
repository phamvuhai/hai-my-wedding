# Animations

## Invitation cover

Opening sequence:

1. Wax seal breaks.
2. Envelope flap opens.
3. Inner invitation card rises from the envelope.
4. Cover dissolves into the homepage.
5. Personalized welcome message appears.

### Regression rule

Do not animate `.intro-photo-polaroid` upward during invitation opening.

The couple photo, personalized name and couple names should remain visually stable.

## Welcome message

The welcome message:
- disappears automatically after about 3 seconds
- dismisses immediately on pointer/touch interaction
- dismisses on swipe/scroll/wheel
- dismisses on common navigation keys

## Falling particles

Current set:
- 🌸 ~55%
- ✨ ~25%
- ❤️ ~10%
- ❄️ ~10%

Particles:
- begin after the invitation cover is opened
- continue across the whole public site
- do not intercept pointer events
- use fewer elements on mobile
- are disabled for `prefers-reduced-motion`

White heart 🤍 is intentionally not used.
