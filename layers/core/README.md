# Core Layer

`layers/core` contains non-auth shared runtime behavior for `nuxtjs-drupal-stir`.

Included in this layer:
- Nitro server routes for generic endpoints (health, webform proxy, paragraph text)
- Drupal CE and menu proxy boundaries that forward only Drupal session cookies
- Generic server plugins
- Shared server utilities for Drupal API headers/requests and paragraph helpers

The core layer replaces only the proxy handlers registered by
`nuxtjs-drupal-ce`; its public composables and `/api/drupal-ce` and `/api/menu`
contracts remain unchanged. This allows request and response cookies to be
filtered at H3's supported proxy hooks.

The base repository enables this layer from root `nuxt.config.ts`:

```ts
extends: ['./layers/core', './layers/theme', './layers/auth']
```
