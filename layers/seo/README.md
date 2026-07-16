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
Global metadata is disabled by default and can be enabled or scoped through
`cmsGlobalSeo` app config.
