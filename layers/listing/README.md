# Stir Listing capability

This optional layer owns the provider-neutral `/api/listings/:listing` server
boundary, its validated v1 response types, and the public `useStirListing` and
legacy `useApiListing` composables.

The root and full compatibility preset include it. Minimal, auth-only, and
Webform-only compositions exclude it. Add it beside a platform-based
composition only when Drupal enables `stir_listing` definitions:

```ts
export default defineNuxtConfig({
  extends: [
    '@stir/base/presets/minimal',
    '@stir/base/layers/listing/nuxt.config',
  ],
})
```

Drupal Views rendering remains part of the shared renderer and is not owned by
this capability. Projects should use `useStirListing` for typed, bounded public
listing definitions and keep flexible editor-selected Views on the existing
embedded View path.
