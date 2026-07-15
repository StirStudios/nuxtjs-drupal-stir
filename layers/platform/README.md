# Stir platform layer

This is the vNext shared Drupal rendering platform. It owns the Nuxt, Nitro,
Nuxt UI, Tailwind, Drupal Custom Elements, proxy, theme, and runtime defaults
needed by every Stir application.

Authentication is composed by the full compatibility entry point. The platform
includes the editorial layer so Drupal tabs, edit controls, and inline editing
remain available by default while retaining a clean optional boundary.
Webform, analytics, and provider integrations are composed separately.

Consumers should normally extend a preset instead of this layer directly:

- `presets/minimal` for the shared renderer only.
- `presets/full` for current production-compatible behaviour.
