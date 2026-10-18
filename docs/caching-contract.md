# Caching contract

Drupal (Stir Tools) decides how long a public response may be cached. Nuxt
passes that on; it never chooses a public lifetime of its own.

## Drupal sends

On every public response:

- `Cache-Control: public, max-age=60, s-maxage=<N>`
- `X-Cache-Tags`: the tags of what the response was built from, space separated
- `X-Stir-Cache-Until`: the Unix time the response ends

The lifetime comes from Drupal cache metadata (max-age, random-order expiry,
bundle and site settings in `stir_varnish_cache_clear.settings`). A custom
endpoint that needs a short lifetime sets it in Drupal, as `s-maxage`.

## Nuxt combines

A page or API response built from several Drupal responses gets the shortest
lifetime and the union of their tags (`server/plugins/cache-tags.ts`,
`server/utils/stirCacheTags.ts`). Fetch Drupal data through the request's own
fetch (`useRequestFetch`, the layer's Drupal helpers) so its tags and lifetime
reach the page.

## Nuxt may only make things more private

`markStirPublicResponse` marks a response public without a lifetime, and falls
back to private for a session cookie or Authorization header.
`markStirPrivateResponse` is for anything personalised, signed in or payment
related. Neither sets a public lifetime.

## Safety nets

The Varnish defaults and the Drupal CE proxy's `s-maxage=300` when Drupal sent
no Cache-Control cover responses that missed the contract. Nothing should rely
on them.
