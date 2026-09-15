# Stir SEO capability

This optional layer owns Drupal global metadata, the Nuxt sitemap integration,
and the `/api/seo/global` and `/api/sitemap` server boundaries.

The root and full compatibility preset include it. The minimal, auth-only, and
Webform-only compositions exclude it, so applications that do not publish an
indexable website do not initialize sitemap runtime or ship SEO proxy routes.
See [Applications](../../docs/consumer-quickstart.md#applications-not-indexed).

Add it beside a platform-based composition when needed:

```ts
export default defineNuxtConfig({
  extends: [
    '@stir/base/presets/minimal',
    '@stir/base/layers/seo/nuxt.config',
  ],
})
```

`DRUPAL_URL` supplies the Drupal sitemap source. `NUXT_URL`, `NUXT_NAME`,
`NUXT_ENV` and `NUXT_INDEXABLE` remain shared site/robots configuration.

This layer is what makes a composition an indexable website. The Robots module
is not part of it: the foundation layer, which every composition loads,
registers Robots so indexability is always enforced. With this layer, a build
is indexable when `NUXT_ENV=production` and `NUXT_INDEXABLE` is not `'false'`.
Without it, the composition is in application mode and never indexable,
whatever those variables say. When not indexable, responses carry
`X-Robots-Tag: noindex, nofollow`, `/robots.txt` disallows every crawler, and
documents (including `ssr: false` ones) get a noindex robots meta tag.

This layer marks `/account/**`, `/auth/**` and `/login` with `robots: false`
route rules, so Robots sends a noindex header and meta for them even on an
indexable production build. Sitemap routes stay registered in non-indexable
environments so `/sitemap.xml` can be checked in development and staging.
Without this layer, `/sitemap.xml`, `/sitemap_index.xml` and `/__sitemap__/**`
return a plain 404.

The optional global-metadata request is disabled by default because it requires
downstream Drupal support. Sites that expose `/api/seo/global` can enable it
through `cmsGlobalSeo.enabled`. Page-level Drupal Metatag output is unaffected.

The layer routes Drupal's global
`og:image`, `twitter:image`, and `image_src` source through the configured Nuxt
Image provider. With `NUXT_IMAGE_CDN`, the resulting absolute URL uses the
pull-CDN `/_ipx/**` origin; without it, the URL uses the current frontend origin.

Drupal remains the single source for favicon and manifest metadata and files;
those links pass through unchanged. Do not duplicate them in the consumer's
`public/` directory or route them through IPX.

## Sitemap extensions

Drupal `/api/sitemap` stays the source of sitemap URLs, and `/sitemap.xml` from
`@nuxtjs/sitemap` stays the public artifact. To add `images` or `videos` to those
URLs, register a `stir:sitemap:extend` handler in a Nitro plugin. Do not
replace `server/api/sitemap.get.ts`.

```ts
// server/plugins/sitemap-class-media.ts
import type { SitemapExtensionEntry } from '@stir/base/layers/seo/shared/types/sitemap'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('stir:sitemap:extend', async ({ event, entries }) => {
    entries.push(...await stirDrupalApiRequest<SitemapExtensionEntry[]>(
      event,
      '/api/example/sitemap-media',
      { method: 'GET', forwardClientIp: true },
    ))
  })
})
```

Each handler receives its own `{ event, entries }` context and pushes entries
shaped like `{ loc, images?, videos? }`, following the `@nuxtjs/sitemap` image
and video formats:

- `loc` must be an absolute http(s) URL. It is matched to a Drupal entry by
  path and query, ignoring host and trailing slash, so canonical host handling
  is unchanged. Entries with no matching Drupal URL are ignored, so an extension
  can enrich URLs but cannot add them.
- Image `loc` and `license` must be absolute http(s) URLs. A video needs a
  non-empty `title` and `description`, an absolute `thumbnail_loc`, and an
  absolute `content_loc` or `player_loc`.
- Contributions from several handlers for the same URL are concatenated.

Handlers run in parallel with the Drupal request. An invalid entry is dropped
with a `[stir:sitemap]` warning. A handler that throws, rejects, or runs longer
than `drupalRequestTimeoutMs` (default 10s) is logged and contributes nothing,
so the base sitemap is still served. An invalid Drupal payload still fails the
request. Dedupe, exclusions and sitemap caching behave as before.
