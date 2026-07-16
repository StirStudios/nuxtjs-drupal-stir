# Drupal downstream contracts

This layer is intended to be reused by downstream Nuxt projects backed by Drupal Custom Elements. Keep these contracts stable unless a downstream migration is planned.

## App context and edit links

App-context requests are made through `/api/app-context` and must preserve the authenticated Drupal request context.

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
- Randomized static rows are stable after client mount and should not reshuffle on unrelated renders.

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
