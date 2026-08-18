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

## Native authoring contract

Component props must describe the editorial control Canvas should generate.
Do not replace these controls with Stir-specific forms:

| Content value | Component schema | Canvas control |
| --- | --- | --- |
| Short text | `string` | Text input |
| Formatted copy | `string` with `contentMediaType: text/html` and block formatting context | Drupal/Canvas rich-text editor |
| Link destination | `string` with `format: uri-reference` | Drupal link widget |
| Fixed option | `string` with `enum` | Select control |
| Toggle | `boolean` | Checkbox/switch |
| Image | `CanvasImage` | Drupal Media Library |

`StirLayout` is structural only. Its named slots are genuine Canvas regions;
editors can add arbitrary approved components to a region and move them between
regions using either the page overlay or Layers panel. Composite components
remain useful for governed sections, but must not replace general page layout.

The expected editing journey is:

1. View the SSR-rendered Nuxt page.
2. Follow one page-level **Edit this page in Canvas** link.
3. Add, edit, reorder, and move components in Canvas.
4. Use Canvas's full-page preview.
5. Review and publish the autosaved change.
6. Return to the Nuxt page and verify the published result.

Paragraph-level frontend edit links are not part of Canvas pages. Reusable or
structured Drupal entities may retain their own entity-edit links.

The integration remains marked experimental while the Canvas component source
API is unstable. Existing Paragraph custom elements and the normal Lupus page
route continue to use the same renderer and are not changed by enabling
preview support.

The proof of concept is a pass only when the workflow above is reliable and the
combined Drupal/Nuxt implementation is materially simpler than the existing
Layout Paragraphs integration. Rendering parity alone is insufficient. Active
upstream slot, preview, or component-source limitations that require a custom
page-builder layer are a stop condition rather than a reason to recreate those
features in Stir Tools.

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
