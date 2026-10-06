# Moving the layer's server code to `nuxt/server`

Status: planned. Start when a Nuxt 5 release candidate is out. Nuxt 4.6 needs
none of this: h3 imports keep working on Nuxt 4. The payoff is that server code
written against `nuxt/server` runs unchanged on Nuxt 5, which moves to Nitro 3
and h3 2.

Read Nuxt's own guide first: [Moving to `nuxt/server`](https://nuxt.com/docs/4.x/getting-started/upgrade#moving-to-nuxtserver).

## Why it cannot be done file by file

A `nuxt/server` helper rejects an h3 event (`NUXT_E8012`), and an h3 helper
expects an h3 event. Every helper a handler calls, directly or through a
utility, must therefore take the same kind of event.

Nearly every route reaches Drupal through `layers/foundation/server/utils/stirDrupalApi.ts`.
It forwards the API key, request cookies and `set-cookie`, and normalizes
upstream errors. As of Nuxt 4.6 that covers:

- auth: login, logout, session, register, password, verify, account settings
- editorial: paragraph text, presentation, formatted text
- listing, theme (view, public files), webform submit
- the foundation and auth middleware

The CE proxy (`layers/core/server/utils/drupalCeProxy.ts`) needs proxy, raw
body and stream helpers that `nuxt/server` does not provide (`proxyRequest`,
`readRawBody`, `getRequestWebStream`). It stays on h3 until Nuxt 5 offers an
equivalent, so check the Nuxt 5 surface before starting.

Nitro plugins (`private-cache-control`, `robots-client-rendered-meta`) have no
`nuxt/server` form and stay as Nitro plugins.

## Behaviour that changes

| h3 v1 | `nuxt/server` |
| --- | --- |
| `createError({ statusCode, statusMessage })` | `createError({ status, statusText })` |
| `sendRedirect()` sends the response | returns it, so the handler must return it |
| `getRouterParams()` decodes | returns URL values; pass `{ decode: true }` |
| `getResponseHeader` / `setResponseHeader` | `event.res.headers.get()` / `.set()` / `.append()` |
| `useRuntimeConfig(event)` | `useRuntimeConfig()` only, no per-request form |
| `getHeader` | `getRequestHeader` |

The layer's server code makes no `useRuntimeConfig(event)` calls today, so
the loss of the per-request form does not block it. Keep it that way.

## Order

1. Make `stirDrupalApi` work with the portable `RequestEvent`. Read headers
   from `event.req`, write `set-cookie` through `event.res.headers.append`,
   and give it its own unit tests.
2. Move one layer's handlers at a time, in this order: seo, listing, theme,
   editorial, webform, auth. Auth is last because it carries cookies and
   redirects.
3. After each layer, run `pnpm verify:ci` and `pnpm audit:consumers --verify`
   for every configured site. Also run the security smoke checklist in
   CLAUDE.md: homepage, an inner CE route, menus, the Webform submit proxy,
   and paragraph read and update.
4. Record each layer in CHANGELOG.md. Sites that override a server route, or
   that import a layer server util, need the same move.

The handlers that need nothing from `stirDrupalApi` (`/api/health`, the
sitemap-unavailable handler, the presentation catalogue) can move at any time.
On their own they are not worth a mixed codebase.
