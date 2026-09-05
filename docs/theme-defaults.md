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
