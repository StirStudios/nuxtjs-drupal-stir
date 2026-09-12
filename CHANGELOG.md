# Changelog

Consumer-affecting changes to the layer. Downstream projects track this
repository as a git branch rather than a published version, so anything that
can break a `pnpm install` or a `pnpm typecheck` belongs here — a GitHub
release does not reach a consumer pinned to `#dev`.

Record an entry when a change is visible from outside the layer: a removed or
renamed export, a changed public composable or component contract, a new or
altered server route, a behavioural change a consumer could notice, or a new
required environment variable. Internal refactors that leave the public surface
untouched do not need one.

## Unreleased

### Removed

- **Breaking.** The rename-only aliases over the shared Drupal request helpers
  are gone. They forwarded to canonical names with no behaviour of their own:

  | Removed | Use instead |
  | --- | --- |
  | `layerAuthThrowDrupalApiError` | `throwStirDrupalApiError` |
  | `layerAuthExtractDrupalErrorDetail` | `extractStirDrupalErrorDetail` |
  | `layerAuthGetDrupalApiConfig` | `getStirDrupalApiConfig` |
  | `layerAuthGetForwardedCookie` | `getStirForwardedCookie` |
  | `layerAuthAppendDrupalSetCookies` | `appendStirDrupalSetCookies` |
  | `layerAuthBuildDrupalHeaders` | `buildStirDrupalHeaders` |

  All are importable from
  `layers/foundation/server/utils/stirDrupalApi`. `layerAuthDrupalApiRequest`
  is unchanged — it defaults `forwardClientIp` and is not a rename.

  `layers/core/server/utils/drupalApi.ts`,
  `layers/core/server/utils/drupalHeaders.ts` and
  `layers/auth/server/utils/drupalHeaders.ts` were removed for the same reason.

- `useAuthAccount` — a thin re-export of four `useAuthApi` methods with no
  consumers in the layer or any known downstream project. Use `useAuthActions`.

### Added

- `useAuthLogin(options?)` takes an optional `redirectTo` callback for
  destinations that can only be decided once the session resolves. It also
  honours `?redirect=` with the Drupal-configured `loginRedirectPath` as
  fallback. Calling it with no argument and no query parameter behaves as
  before. See `layers/auth/README.md`.
- The account settings guard now carries its destination on `?redirect=`, so a
  signed-out visitor following a link there returns after signing in.
- `resolveAuthSessionAccess(session)` projects an auth-session snapshot onto the
  editorial access shape, so role rules stay defined once alongside
  `resolveDrupalPageAccess`.

### Changed

- **Protected pages are enforced at the server boundary.** Gating lived only in
  the route middleware, so the page payload behind a protected route stayed
  fetchable from `/api/drupal-ce/<path>`. Requests for a configured protected
  path now need a valid protected-access cookie, or a verified Drupal session
  where `allowAuthenticatedUserBypass` is on. `requireLoginPaths` remains the
  single authoring surface in `app.config.ts`; no consumer configuration
  changes. Note this is a Nuxt-local gate, not Drupal access control.
- Non-`GET` requests through `/api/drupal-ce` now require a matching origin.
  Reads are unaffected. A consumer that posts cross-origin to that proxy will
  receive a 403.
- The initial-graph performance budget was re-baselined to the measured Nuxt
  4.5 numbers and is now enforced in CI rather than warned about. A breach
  names the packages that grew. See `docs/perf-initial-graph.md`.
- The published archive budget rose from 310000 to 320000 bytes.

### Fixed

- **Editorial tabs return for administrators on mixed routes.** Access was
  resolved from the current Drupal page payload alone, so `DrupalTabs`
  disappeared on any route whose payload carries no `local_tasks`.
  `usePageContext` merges an administrator session back in. The session lookup
  stays behind a client-only render: `drupal-session-no-ssr` already disables
  SSR for any request carrying a Drupal session cookie, so a server-rendered
  public page never reaches `/api/auth/session`.
- **Open redirect.** `useProtectedLogin` accepted any redirect starting with
  `/`, so a protocol-relative `//evil.com` navigated off-site. Both auth
  composables now share a validator that rejects protocol-relative and
  backslash-escaped hosts, absolute URLs and control characters, and applies
  the same rule to the Drupal-owned fallback.
- Nuxt UI's timeline renders its date as `text-dimmed`, which measured 3.67:1
  at 12px on the dark surface against the 4.5:1 WCAG 2.2 AA requirement. The
  paragraph timeline overrides that slot. The shared token is untouched.
