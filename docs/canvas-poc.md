# Drupal Canvas proof of concept

The full Stir preset exposes an experimental, governed component catalogue for
Drupal Canvas through the `nuxt-component-preview` integration already shipped
by `nuxtjs-drupal-ce`.

Enable the catalogue at build time with:

```dotenv
STIR_CANVAS_ENABLED=true
```

The default is disabled, so existing consumers do not gain preview routes or
cross-origin behavior merely by updating the Stir layer.

## Public component contract

Only globally registered components under `components/global/Stir` are
included in `/nuxt-component-preview/component-index.json`, including when the
Stir layer is installed as a dependency of a downstream site. Other package
components and internal fallback components are excluded. The initial
catalogue is:

| Canvas component | Purpose | Slots |
| --- | --- | --- |
| `StirHero` | Page hero | `media`, `actions` |
| `StirRichText` | Formatted editorial copy | none |
| `StirLayout` | One, two, or three columns and grids | `top`, `first`, `second`, `third`, `items`, `bottom` |
| `StirButton` | Call to action | none |
| `StirMediaCollection` | Media/gallery presentation | `media` |
| `StirDynamicContent` | Drupal-rendered Views, listings, or blocks | `content` |

These components are thin source-independent contracts over the existing Stir
presentation components. Their props deliberately expose semantic choices,
not Tailwind classes, Paragraph UUIDs, edit links, or other producer metadata.

The integration remains marked experimental while the Canvas component source
API is unstable. Existing Paragraph custom elements and the normal Lupus page
route continue to use the same renderer and are not changed by enabling
preview support.

## Drupal registration

1. Enable the Stir Tools `stir_canvas` submodule.
2. Configure Lupus Decoupled's Nuxt preview provider and frontend base URL.
3. Run `drush canvas:extjs-auto-register`, or register the detected source at
   **Appearance > Components > External JS**.
4. Re-register after changing a public prop or slot contract.

The Drupal backend origin comes from `DRUPAL_URL`; the connector configures
preview CORS from the same value. A deployed frontend behind a CDN should also
set `NUXT_APP_CDN_URL` so preview assets resolve against the frontend rather
than the Drupal editor origin.

## Compatibility and failures

Canvas and Paragraphs may render side by side because both resolve to the
existing source-independent Custom Elements tree. Development builds replace
unknown components with a visible diagnostic. Production keeps the upstream
safe fallback behavior so an unresolved component cannot crash the page.
