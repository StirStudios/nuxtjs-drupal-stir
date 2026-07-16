# Stir platform layer

This is the vNext Drupal website rendering platform. It composes the shared
foundation with Drupal Custom Elements proxy routes, page/app context, theme,
and website-shell defaults.

Focused applications do not need this layer merely to use Stir server policy
or Nuxt UI. Auth and Turnstile compose `layers/foundation` directly; Webform
currently composes this platform until its shared field renderer is extracted.

Authentication, Webform, SEO, configured listings, editorial tools, analytics,
scripts, and provider integrations are composed by explicit capability layers.
None are part of this shared platform boundary.

Consumers should normally extend a preset instead of this layer directly:

- `presets/minimal` for the shared renderer only.
- `presets/full` for current production-compatible behaviour.
