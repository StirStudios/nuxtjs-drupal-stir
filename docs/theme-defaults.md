# Shared theme defaults

The foundation owns Tailwind and Nuxt UI imports. The theme entry imports base
typography, reusable utilities, media defaults and motion styles separately.
Consumers import the theme entry once, then add intentional brand styling.

Rich-text paragraphs use 1em vertical margins and proportional normal leading.
First/last content edges retain their existing resets. Nuxt UI owns semantic
text colors, including text-dimmed. Component utilities can override base media
styles without fighting unlayered selectors or forced image margins.

The default layout contains horizontal reveal overflow at the page boundary.
Custom layouts should provide an equivalent outer boundary when using translated
reveals. Sections are no longer clipped globally. Menu panels and media hover
zoom respect reduced motion.

`stirTheme.hero.mediaAppearance` defaults to `dark text-default` and applies only
to media-backed full heroes. Set it to `light text-default` for an intentionally
light media treatment, or an empty string to inherit the page appearance.
This is local appearance, not a global color-mode preference change. Media still
needs sufficient contrast/overlay treatment; dark mode alone cannot ensure it.

Text-only hero fallback surfaces should supply their matching appearance through
`hero.noMediaFallback`. Client-specific headings, decorative typography and
statistics variants remain downstream responsibilities.

Migration: remove redundant paragraph leading/margin overrides after updating the
layer. Keep `text-base` on content accordion bodies where Nuxt UI's compact
`text-sm` default is unsuitable. No Drupal payload or environment changes.

Layout container alignment accepts the existing Drupal horizontal alignment values.
With Container enabled, the page container stays centered and Left, Center or
Right positions the width-constrained layout inside it. None retains the centered
default. With Container disabled, alignment uses the available parent width.
Alignment does not change text alignment or the grid. A full-width
layout has no spare horizontal space to move within. Existing layouts need no
content changes; run the Stir Tools database updates to expose the CMS control.

Video previews with a visible overlaid media title use a compact corner play
indicator. Hidden, empty and below-preview titles retain the centered indicator.
The entire preview remains the keyboard-accessible playback trigger; no CMS
configuration or update hook is needed.

Drupal supplies `layout_tag` (`layoutTag` in Vue): root layouts use `section`,
layouts owned by another paragraph use `div`. Nuxt renders only these two tags;
missing or unsupported values retain the legacy `section` default. Headings do
not determine the wrapper. Project exceptions use the existing Drupal field
processing hook, without another editorial setting. IDs, classes and editing
controls are unchanged. Target classes/IDs instead of assuming every layout is
a `section`. Deploy this consumer before the producer and rebuild Drupal caches.
