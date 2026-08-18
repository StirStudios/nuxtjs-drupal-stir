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
Global metadata and social-image delivery are enabled by default and can be
scoped or disabled through `cmsGlobalSeo` app config. Non-indexable apps that do
not publish SEO metadata should set `cmsGlobalSeo.enabled` to `false`.

The layer routes Drupal's global
`og:image`, `twitter:image`, and `image_src` source through the configured Nuxt
Image provider. With `NUXT_IMAGE_CDN`, the resulting absolute URL uses the
pull-CDN `/_ipx/**` origin; without it, the URL uses the current frontend origin.

Drupal's favicon and manifest links pass through unchanged so their metadata and
files retain one CMS-owned lifecycle. Do not duplicate these assets in the
consumer's `public/` directory unless that project intentionally takes ownership.
