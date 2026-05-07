# Theme Layer

`layers/theme` contains reusable visual and design-system defaults for `nuxtjs-drupal-stir`.

Included in this layer:
- Nuxt app theme config (`app/app.config.ts`)
- UI variant helpers (`app/utils/uiVariants.ts`)
- Theme/shell components (`App/*`, `Site/*`, `Icons/*`, `Wrap/*`)
- Presentation components (`Drupal/*`, `Edit/*`, `Field/*`, `StirPdfViewer.client.vue`)
- Default app rendering shell (`app/layouts/*`, `app/pages/[...slug].vue`, `app/error.vue`)
- Reusable visual CE components (`global/*`, `global/Media/*`, most `global/Paragraph/*`)
- Theme assets and client plugins (`app/assets/*`, `app/plugins/*`, `app/middleware/colorMode.global.ts`)
- UI composables, UI utilities, and app-local type shims (`app/composables/*`, `app/utils/*`, `app/types/*`)

The base repository enables this layer from root `nuxt.config.ts`:

```ts
extends: ['./layers/core', './layers/theme', './layers/auth']
```

## Boundary guidance

Keep in `layers/theme`:
- Presentation and layout components
- Theme-level UI wrappers and CE display components
- Visual helpers that are reusable across projects

Keep outside `layers/theme`:
- Auth/session and protected-route behavior (`layers/auth`)
- Server proxy/runtime behavior (`layers/core`)
- Highly project-specific business logic or workflow-specific forms
