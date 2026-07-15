# Core Layer

`layers/core` contains non-auth shared runtime behavior for `nuxtjs-drupal-stir`.

Included in this layer:
- Nitro server routes for generic endpoints (health, app context, paragraph text)
- Drupal CE and menu proxy boundaries that forward only Drupal session cookies
- Generic server plugins
- Shared server utilities for Drupal API headers/requests and paragraph helpers
- Producer-contract parsing that normalizes app-context compatibility shapes
  before they reach theme components

The app-context proxy forwards Drupal session cookies so Drupal remains
authoritative for access and edit links. Invalid or unavailable upstream
responses are logged without request headers or credentials and return a
stable empty shell payload. The synchronized producer fixture is parsed by the
same production boundary in CI.

The optional global SEO boundary also validates Drupal's interface language
and resolved `meta`/`link` attribute maps before Nuxt head code consumes them.
An unavailable or malformed provider returns empty tag lists, preserving the
configured frontend language fallback.

The core layer replaces only the proxy handlers registered by
`nuxtjs-drupal-ce`; its public composables and `/api/drupal-ce` and `/api/menu`
contracts remain unchanged. This allows request and response cookies to be
filtered at H3's supported proxy hooks.

The base repository enables this layer from root `nuxt.config.ts`:

```ts
extends: ['./layers/core', './layers/theme', './layers/auth']
```
