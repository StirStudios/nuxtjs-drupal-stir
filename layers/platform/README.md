# Stir platform layer

This is the vNext shared Drupal rendering platform. It owns the Nuxt, Nitro,
Nuxt UI, Tailwind, Drupal Custom Elements, proxy, theme, and runtime defaults
needed by every Stir application.

Authentication is no longer part of this shared layer and is composed by the
full compatibility entry point. Webform, editor, analytics, and provider code
still present in the theme will be extracted in subsequent capability slices;
their current presence here is compatibility, not the final boundary.

Consumers should normally extend a preset instead of this layer directly:

- `presets/minimal` for the shared renderer only.
- `presets/full` for current production-compatible behaviour.
