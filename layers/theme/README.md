# Theme Layer

`layers/theme` contains reusable visual and design-system defaults for `nuxtjs-drupal-stir`.

Included in this layer:

- Nuxt app theme config (`app/app.config.ts`)
- Private Nuxt UI theme defaults (`app/theme/nuxtUi.ts`)
- Deprecated UI variant aliases for downstream compatibility (`app/utils/uiVariants.ts`)
- Theme/shell components (`App/*`, `Site/*`, `Icons/*`, `Wrap/*`)
- Presentation components (`Drupal/*`, `Field/*`, `StirPdfViewer.client.vue`)
- Default app rendering shell (`app/layouts/*`, `app/pages/[...slug].vue`, `app/error.vue`)
- Reusable visual CE components (`global/*`, `global/Media/*`, most `global/Paragraph/*`)
- Theme assets and client plugins (`app/assets/*`, `app/plugins/*`, `app/middleware/colorMode.global.ts`)
- UI composables, UI utilities, and app-local type shims (`app/composables/*`, `app/utils/*`, `app/types/*`)

The base repository enables this layer from root `nuxt.config.ts`:

```ts
  extends: ['./layers/platform', './layers/seo', './layers/listing', './layers/editorial', './layers/integrations', './layers/analytics', './layers/scripts', './layers/webform', './layers/auth']
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

### Nuxt UI theme ownership

Shared Nuxt UI component defaults and the Stir Material field variant live in
`app/theme/nuxtUi.ts`. `app.config.ts` composes that preset with the public Stir
configuration, while downstream projects may continue to override any `ui`
key through normal Nuxt app-config merging. Keep implementation class strings
private to the theme layer; select the Material presentation through
`stirTheme.webform.fieldVariant` instead of importing class helpers.

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
- Sitemap and Drupal-owned global metadata (`layers/seo`)
- Provider-neutral configured listings (`layers/listing`)
- Drupal tabs, edit controls, and inline editing (`layers/editorial`)
- Server proxy/runtime behavior (`layers/core`)
- Highly project-specific business logic or workflow-specific forms
- Popup/privacy UI and persisted consent policy (`layers/integrations`)

### Clean wrapper markup

`WrapDiv` is an optional element boundary: it renders its slot directly when no
non-empty alignment or class value is present. `WrapGrid` follows the same rule
and combines layout, width, spacing, and grid classes on one element for normal
grids. Card grids deliberately retain separate outer and content layers because
the gradient is a sibling behind the grid content. Do not add unconditional
wrapper elements around these components merely to make styling convenient.

Editorial `EditLink` controls also render beside their slot without adding a
shell. The editorial stylesheet positions the existing parent only when it has
a direct controls child, keeping anonymous production markup unchanged.

### Nuxt Image delivery

Nuxt Image with the local IPX provider is the default image delivery path. Allow
the Drupal asset hostname with `NUXT_IMAGE_DOMAINS`. Projects using IPX must
also permit the package manager to build Sharp in their trusted-dependency
policy. Set `STIR_IMAGE_DELIVERY=drupal` only as a temporary compatibility
fallback to Drupal responsive `src` and `srcset` output.

Set `NUXT_IMAGE_CDN` to an absolute CDN origin such as
`https://images.example.com` to render IPX derivative URLs through an ordinary
pull CDN. The CDN origin must point to the Nuxt application, forward `/_ipx/**`,
and cache successful responses. This mode deliberately reuses Nuxt Image's IPX
provider and keeps Nuxt's local `/_ipx` transformer registered; it does not
require Bunny Optimizer, a storage zone, or pre-uploaded derivatives.

`MediaImage` uses Nuxt Image only when the payload contains both
`originalSrc`/`originalRevision` and a known semantic profile. It versions the
canonical source, passes it to Nuxt Image, and suppresses the Drupal derivative
`srcset`. Missing metadata and unknown/project-specific responsive styles
retain native Drupal rendering.

Default profile sizes and WebP quality live under
`stirTheme.media.image`. Downstream apps may override those app-config values,
but should keep the semantic keys (`hero`, `full`, `container`, `split`, and
`card`) instead of scattering provider-specific size strings through
components. Modal image normalization promotes Drupal's
`modalResponsiveStyle` so the modal selects the corresponding profile.

### Standard Drupal field values

Global components render producer-owned standard field contracts without
project adapters. `address-value` renders structured Address-module values as a
semantic `<address>` and exposes all postal parts, `displayLines`, and the
provider-neutral `searchQuery` through its default scoped slot. Projects may
choose a maps provider or compact card presentation without reparsing text.

The `field-text-with-summary` compatibility component preserves upstream
Custom Elements slot output and can also render Drupal-filtered `content`,
`processed`, `value`, or `summary` props. Its scoped slot exposes the original
values for project-specific card presentation without a global passthrough
override.

`entity-reference` forwards presentation attributes to its rendered link or
text element and exposes normalized identity, label, type, and URL values to a
scoped default slot. Styling a reference therefore does not require replacing
the shared contract renderer.

The default node renderer forwards every named Drupal field slot and renders
all non-reserved slots in producer order. A content type made from ordinary
fields therefore does not need Layout Paragraphs or a Nuxt node override merely
to display its exposed fields; a project override is only needed for deliberate
page composition or product behavior.

The block-content parent follows the same rule and renders all exposed named
slots in producer order. Parent renderers must not discard a field merely
because its machine name was unknown when the shared layer was built.
