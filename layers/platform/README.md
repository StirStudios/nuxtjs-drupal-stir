# Stir platform layer

This is the vNext shared Drupal rendering platform. It owns the Nuxt, Nitro,
Nuxt UI, Tailwind, Drupal Custom Elements, proxy, theme, and runtime defaults
needed by every Stir application.

Authentication, Webform, SEO, editorial tools, analytics, scripts, and provider
integrations are composed by explicit capability layers. None are part of this
shared platform boundary.

Consumers should normally extend a preset instead of this layer directly:

- `presets/minimal` for the shared renderer only.
- `presets/full` for current production-compatible behaviour.
