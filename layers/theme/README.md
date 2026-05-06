# Theme Layer

`layers/theme` contains reusable visual and design-system defaults for `nuxtjs-drupal-stir`.

Included in this layer:
- Nuxt app theme config (`app/app.config.ts`)
- UI variant helpers (`app/utils/uiVariants.ts`)

The base repository enables this layer from root `nuxt.config.ts`:

```ts
extends: ['./layers/core', './layers/theme', './layers/auth']
```
