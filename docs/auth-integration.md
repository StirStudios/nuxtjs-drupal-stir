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

## Turnstile

- Auth forms can include Turnstile tokens.
- Server-side validation belongs in Drupal (`stir_turnstile` + consuming modules).

## Recommended rate limits (Drupal Flood)

Use Flood API limits in `stir_account` even when Turnstile is enabled.

Suggested defaults:

- Login: `10 attempts / 15 minutes` per identifier+IP, `30 attempts / 15 minutes` per IP.
- Register: `5 attempts / 60 minutes` per IP.
- Password request: `5 attempts / 60 minutes` per identifier+IP, `20 attempts / 60 minutes` per IP.
- Verify: `20 attempts / 60 minutes` per IP.

Return `429` JSON responses when limits are exceeded.

## Deployment notes

- Keep auth and Drupal hosts on cookie-compatible domains.
- In local mismatched-host development (for example `127.0.0.1` vs custom domain), Drupal session cookies may be rejected by the browser.
- Prefer running local domains that match cookie domain expectations to avoid auth false-negatives.
