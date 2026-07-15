# Theme Layer

`layers/theme` contains reusable visual and design-system defaults for `nuxtjs-drupal-stir`.

Included in this layer:
- Nuxt app theme config (`app/app.config.ts`)
- UI variant helpers (`app/utils/uiVariants.ts`)
- Theme/shell components (`App/*`, `Site/*`, `Icons/*`, `Wrap/*`)
- Presentation components (`Drupal/*`, `Field/*`, `StirPdfViewer.client.vue`)
- Default app rendering shell (`app/layouts/*`, `app/pages/[...slug].vue`, `app/error.vue`)
- Reusable visual CE components (`global/*`, `global/Media/*`, most `global/Paragraph/*`)
- Theme assets and client plugins (`app/assets/*`, `app/plugins/*`, `app/middleware/colorMode.global.ts`)
- UI composables, UI utilities, and app-local type shims (`app/composables/*`, `app/utils/*`, `app/types/*`)

The base repository enables this layer from root `nuxt.config.ts`:

```ts
extends: ['./layers/platform', './layers/analytics', './layers/scripts', './layers/webform', './layers/auth']
```

## Boundary guidance

### Trusted Drupal HTML

Drupal is the single sanitization authority for CMS markup. Every value passed to
`v-html` must come from a Drupal field configured with an appropriate filtered
text format, then pass through `trustedDrupalHtml()` to make that trust boundary
explicit. Never use this helper for browser input, third-party responses, or
otherwise untrusted HTML.

Nuxt auto-imports are preferred for framework composables and components in
normal application code. Keep explicit imports for external packages, types,
shared utilities, and isolated test components where Nuxt auto-import context is
not guaranteed.

### Drupal Custom Elements

Theme code consumes `useStirDrupalCe()` rather than `useDrupalCe()` directly.
The Stir facade delegates the upstream Lupus/Custom Elements API unchanged and
owns Stir-specific rendering policy. In development it turns unresolved Custom
Elements and unknown `field-*` elements into visible diagnostics; production
keeps the upstream rendering path without traversing the component tree.

Keep in `layers/theme`:
- Presentation and layout components
- Theme-level UI wrappers and CE display components
- Visual helpers that are reusable across projects

Keep outside `layers/theme`:
- Auth/session and protected-route behavior (`layers/auth`)
- Drupal tabs, edit controls, and inline editing (`layers/editorial`)
- Server proxy/runtime behavior (`layers/core`)
- Highly project-specific business logic or workflow-specific forms
