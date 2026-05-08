# Core Layer

`layers/core` contains non-auth shared runtime behavior for `nuxtjs-drupal-stir`.

Included in this layer:
- Nitro server routes for generic endpoints (health, webform proxy, paragraph text)
- Generic server plugins
- Shared server utilities for Drupal API headers/requests and paragraph helpers

The base repository enables this layer from root `nuxt.config.ts`:

```ts
extends: ['./layers/core', './layers/auth']
```
