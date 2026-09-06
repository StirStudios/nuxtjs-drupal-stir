# Auth Integration Guide

This layer is designed to work with `stir_account` on Drupal and keeps a single auth source of truth at `/api/auth/session`.

## Routes (Nuxt)

- `/auth/login`
- `/auth/logout`
- `/auth/register`
- `/auth/password/request`
- `/auth/password/reset`
- `/auth/verify`
- `/auth/protected` (optional password-only route gate)

## Backend endpoints expected

Core webform submission is intentionally independent from the auth layer. It
uses the shared Drupal server utilities to fetch `/session/token` directly
before forwarding submissions to Drupal.

From `stir_account`:

- `GET /api/auth/session`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/register`
- `GET /api/auth/register-policy`
- `POST /api/auth/password/request`
- `POST /api/auth/password/validate`
- `POST /api/auth/password/reset`
- `POST /api/auth/verify`

## Source of truth

- UI auth state must always come from `GET /api/auth/session`.
- Do not maintain parallel client auth stores that can drift from server session state.

## Authenticated rendering and navigation

HTML requests carrying a configured Drupal session cookie are rendered with
`event.context.nuxt.noSSR = true` and `Cache-Control: private, no-store`. This
keeps authenticated Drupal output out of shared SSR caches; it does not turn
internal Nuxt links into document navigations.

Nuxt client navigation follows the framework's native Suspense contract:

- awaited `useAsyncData`/`useFetch` blocks navigation and retains the current
  page until the destination resolves;
- `useLazyAsyncData`, `useLazyFetch`, or `lazy: true` commits the destination
  immediately, so the destination must render a localized pending state;
- the SPA loading template is only the initial document fallback for a
  client-rendered response and cannot retain a previous in-memory page.

Shared route-derived presentation must use `useNavLockedSnapshot()`. The
navigation lock begins at Nuxt's `page:loading:start` hook, before route
resolution, and ends at `page:loading:end`. Do not replace this with
`page:start`: that hook represents the later NuxtPage Suspense pending event and
can allow headers, heroes, or active context to advance while the prior page is
still visible.

Choose blocking versus lazy data per experience. Do not globally convert
authenticated data to lazy loading, and do not cache session-bearing responses
as a substitute for slow Drupal endpoints.

## Cookie-authenticated CSRF

The shared Nitro Drupal client automatically fetches `/session/token` with the
forwarded Drupal session cookie and attaches `X-CSRF-Token` to non-GET Drupal
requests whenever that cookie is present. Auth/account route handlers should use
`layerAuthDrupalApiRequest()` rather than implementing token forwarding locally.

This matches `stir_account` protection for logout, account settings, email,
password, and cancellation mutations. Public login, registration, verification,
and reset-token workflows do not depend on ambient authenticated authority and
remain available without a pre-existing session token.

## Turnstile

- Auth forms can include Turnstile tokens.
- Server-side validation belongs in Drupal (`stir_turnstile` + consuming modules).
- The local `/auth/protected` password gate verifies Turnstile in Nuxt before
  comparing the configured password. `TURNSTILE_KEY` and `TURNSTILE_SECRET`
  are therefore required whenever `PROTECTED_PASSWORD` is enabled.
- Protected-access cookies are signed with `PROTECTED_PASSWORD`; rotating the
  password immediately invalidates existing protected sessions.
- SSR responses for configured protected routes and authentication pages are
  marked `private, no-store`; do not override that policy in Varnish or at the
  edge.

## Recommended rate limits (Drupal Flood)

Use Flood API limits in `stir_account` even when Turnstile is enabled.

Suggested defaults:

- Login: `10 attempts / 15 minutes` per identifier+IP, `30 attempts / 15 minutes` per IP.
- Register: `5 attempts / 60 minutes` per IP.
- Password request: `5 attempts / 60 minutes` per identifier+IP, `20 attempts / 60 minutes` per IP.
- Verify: `20 attempts / 60 minutes` per IP.

Return `429` JSON responses when limits are exceeded.

## Local protected-page rate limiting

The local protected-password gate atomically reserves an attempt **before**
Turnstile/password validation. The default `rate-limiter-flexible` memory limiter
supports one Node process, using the existing configured attempt/window limits.
Successful login clears the identifier's window. Concurrent failed attempts can
no longer overwrite one another. A failed atomic backend returns a safe 503;
a consumed limit returns 429 with `Retry-After`.

For multiple workers, serverless instances or restart-persistent enforcement,
use a shared atomic limiter or enforce the equivalent policy at a trusted edge.
Plain Nitro `getItem`/`setItem` storage is not an atomic limiter. A consumer Nitro
plugin can set `event.context.stirProtectedRateLimiter` on each request to one
shared adapter implementing `consume(key): Promise<unknown>` and
`delete(key): Promise<unknown>`. `consume` must atomically reserve an attempt and
reject exhausted requests with a finite numeric `msBeforeNext`; reject backend
failures with an Error. A configured `RateLimiterRedis` instance from
`rate-limiter-flexible` implements this interface. Use the same points/duration
as `protectedRateLimit.maxAttempts`/`windowSeconds`, a deployment-specific key
prefix, and a persistent store. Do not use a non-atomic adapter or silently fall
back to per-worker memory on backend failure. No Redis service is required for
a single-process deployment.

Keys contain a SHA-256 hash of the resolved client identifier. The old separate
check/record helpers and best-effort Nitro storage contract were internal to
the protected-login route; consumers should use the atomic adapter seam above.
The [read-only consumer scan](consumer-compatibility-2026-09-06.md) found no callers
of those old helpers.

`PROTECTED_RATE_LIMIT_TRUST_PROXY` defaults to `false`. Enable it only when a
trusted ingress removes client-supplied forwarding headers and sets
`X-Forwarded-For` itself.

## Deployment notes

- Keep auth and Drupal hosts on cookie-compatible domains.
- In local mismatched-host development (for example `127.0.0.1` vs custom domain), Drupal session cookies may be rejected by the browser.
- Prefer running local domains that match cookie domain expectations to avoid auth false-negatives.
