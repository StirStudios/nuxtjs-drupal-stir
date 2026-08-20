# Stir SEO capability

This optional layer owns Drupal global metadata, the Nuxt sitemap integration,
and the `/api/seo/global` and `/api/sitemap` server boundaries.

The root and full compatibility preset include it. The minimal, auth-only, and
Webform-only compositions exclude it, so applications that do not publish an
indexable website do not initialize sitemap runtime or ship SEO proxy routes.

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
`NUXT_ENV` and `NUXT_INDEXABLE` remain shared site/robots configuration. The
Robots module is registered only when this SEO capability is selected.
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
