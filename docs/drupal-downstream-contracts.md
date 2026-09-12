# Drupal downstream contracts

This layer is intended to be reused by downstream Nuxt projects backed by Drupal Custom Elements. Keep these contracts stable unless a downstream migration is planned.

## App context and edit links

App-context requests are made through `/api/app-context` and must preserve the authenticated Drupal request context.

`useAppContext`, `useAppFooterContext`, and `useAppRegionBlocks` share one
route-keyed Nuxt data entry. Footer and region helpers expose read-only projections
of that response rather than serializing separate copies. This works independently
of CE page content, including Nuxt-only routes. Drupal still evaluates visibility.

For conditional initial loading, use `immediate: false` and call `execute()` only
when the returned `status.value` is not `success`. Both `execute()` and `refresh()`
remain explicit refresh operations. Downstream footer overrides that call
`execute()` unconditionally should adopt the same status check to avoid a redundant
request. Route changes fetch the destination context; authentication actions clear
and refresh existing app-context entries. Custom authentication integrations must
likewise invalidate app-context when their session changes. Do not persist this
response in a cross-user or indefinite client cache.

Required behavior:

- Forward incoming request cookies from Nuxt server routes to Drupal.
- Forward configured Drupal API keys on server-side Drupal calls.
- Preserve `set-cookie` headers where auth endpoints proxy Drupal responses.
- Treat missing app-context responses as a recoverable page-rendering failure, but log enough detail server-side to debug Drupal/API issues.

Downstream smoke checks:

- Authenticated editor can load a page and see edit links from app context.
- Anonymous user does not receive editor-only links.
- Homepage, one inner CE page, and the main menu endpoint all return successfully.

## Drupal views and dynamic rows

Drupal view custom elements should expose stable `viewId`, `displayId`, and, when nested in a paragraph, `parentUuid` props.

Expected view payload shape:

```json
{
  "element": "drupal-view-default",
  "props": {
    "viewId": "testimonials",
    "displayId": "block_1",
    "parentUuid": "paragraph-uuid",
    "pager": {
      "current": 0,
      "totalPages": 2
    },
    "exposedFilters": [],
    "exposedSorts": []
  },
  "slots": {
    "rows": []
  }
}
```

Supported behavior:

- Static view rows render from the `rows` slot.
- Dynamic filter/sort/page changes refetch the current route with sanitized query params.
- Missing refreshed view nodes fall back to empty rows instead of breaking the page.
- Drupal owns View row ordering, including randomization. Nuxt preserves the supplied order for initial SSR rows and subsequent filter, sort, and pager responses; the legacy `randomize` attribute no longer triggers a second client shuffle. Unpaged/limited Stir Tools Views already randomize in Drupal. Paginated Views retain their configured deterministic ordering to avoid duplicate or missing results between pages. Media paragraph ordering is also owned by the Stir Tools media formatter. Deploy the backend media-ordering update before or alongside this Nuxt update; older backends will retain authored media order. Randomized media output remains cacheable and keeps the same order until its cached output is rebuilt. No new field or environment variable is required. The unused Nuxt `useMediaOrdering`, `shuffleArray`, and slots-toolkit `shuffle`/`hydrateOrder` helpers have been removed. Legacy `randomize` props remain declared to consume existing CE attributes without leaking them onto DOM elements.

Downstream requirements:

- If a Drupal view block is rendered inside a paragraph, keep the paragraph UUID available in the view props.
- Exposed filter option values should be stable machine values, not labels that may change.
- Sort order values should use Drupal-compatible values such as `ASC` and `DESC`.

## Performance-critical listings

Use `useStirListing('listing_machine_name')` for a configured Stir Listing API
definition. The composable always calls the shared Nuxt
`/api/listings/:listing` boundary; projects should not recreate Drupal URL,
API-key, cookie, redirect, response-validation, cache, or privacy handling.

Downstream projects continue to own their listing definition, card component,
and genuinely project-specific query or access semantics. Stir owns bounded
request forwarding, the versioned response envelope, ordered paging metadata,
session safety, and public-cache propagation. A listing machine name such as
`articles` in a fixture is illustrative, not a required content type.
Validated anonymous responses retain Drupal's public validators and cache
policy. Personalized, session-bearing, session-setting, upstream-error, and
invalid-contract responses are always private and `no-store` at the Nuxt edge.

Measure Drupal time-to-first-byte separately from Nuxt route timing. A retained
page or localized skeleton improves continuity but does not make a slow Drupal
listing response faster. Optimize the Drupal query, serialization, cache tags,
and anonymous cacheability at the producer; preserve private/no-store handling
for requests whose response includes favorites, progress, access, edit links,
or other user-specific data.

## Media discovery and rendering

Media helpers normalize supported Drupal media types before consumers inspect or render media nodes.

Supported media types:

- Image
- Video
- Document
- Audio
- Link

Downstream requirements:

- Keep media custom element names aligned with the layer media components.
- Do not assume page media helpers return only images.
- If a downstream project adds another media type, extend the shared media normalizer and rendering map together.

## Theme overrides and Nuxt UI

Downstream theme overrides should prefer Nuxt UI semantic classes and typed component props.

Preferred:

```ts
export default defineAppConfig({
  stirTheme: {
    navigation: {
      background: 'border-none bg-default/90 shadow backdrop-blur-md dark:bg-default/70',
      color: 'primary',
      variant: 'link',
    },
  },
})
```

Avoid when possible:

```ts
export default defineAppConfig({
  stirTheme: {
    navigation: {
      background: 'bg-white dark:bg-gray-950',
    },
  },
})
```

Raw palette classes are still allowed for project-specific brand art direction, but semantic tokens make downstream color-mode behavior and Nuxt UI upgrades safer.

## Validation checklist for downstream updates

After updating `@stir/base` in a downstream repo:

```bash
pnpm typecheck
pnpm build
```

Recommended smoke checks:

- Homepage loads.
- One inner Drupal CE page loads.
- Main menu endpoint returns JSON.
- App-context edit links behave correctly for authenticated and anonymous users.
- A Drupal view block with exposed filters still filters, sorts, paginates, and restores browser history correctly.
- Drupal View controls are automatically namespaced from the stable paragraph
  UUID/ID. If those identifiers are unavailable, the layer uses a deterministic
  View ID, display ID, and contextual-arguments fallback. An explicit
  `queryNamespace` remains available as an override, but downstream
  `cloneVNode()` workarounds are not required.
- Public View-control URLs now use namespaced keys such as
  `work_a0b1c2d3_page=1`. Drupal requests still receive their original keys,
  such as `page=1`. Existing bookmarks that use unnamespaced keys such as
  `page=1` should be regenerated or redirected to the corresponding namespaced
  URL when upgrading.

## Page-owned Hero data

`DrupalPageRoute` provides its local page reference through `drupalPageKey`.
The shared paragraph Hero reads that owner for its title and front-page state,
so overlapping route transitions do not exchange Hero content. Standalone Hero
usage retains the existing navigation snapshot fallback. Blank authored titles
fall back to the Drupal page title; an entirely blank title emits no empty H1.
A custom title slot owns its heading markup. No wrapper is added by the provider.
Downstream Hero overrides must adopt the owning-page reference explicitly if they
currently read the global page state.

## Node share links (opt-in per content type)

`DrupalNodeDisplay` renders a `ShareLinks` menu for any full node render (article
or default; not teasers) when the node payload sets a truthy `shareLinks` prop.
This is off by default for any node that omits the field or sends a falsy value.

- Drupal exposes this as a boolean custom-element attribute (kebab-case, e.g.
  `share-links`), which the Custom Elements runtime maps to the `shareLinks`
  prop on `NodeCommonProps` the same way `hide-title` maps to `hideTitle`.
- Any content type can opt in by adding the same boolean field/attribute to its
  display and enabling it per node; no article-specific coupling remains.
- Downstream `article`/`default` slot overrides in `DrupalNodeDisplay` still
  receive the shared share-links container above the slot, since it renders
  once for any non-teaser mode rather than only inside the default `<article>`
  markup.
