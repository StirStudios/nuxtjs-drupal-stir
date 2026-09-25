# Current authoritative sources

Verify these sources when guidance or dependency status may have changed.

## Drupal

- Metatag: https://www.drupal.org/project/metatag
- Schema.org Metatag: https://www.drupal.org/project/schema_metatag
- Simple XML Sitemap: https://www.drupal.org/project/simple_sitemap
- Redirect: https://www.drupal.org/project/redirect
- Pathauto: https://www.drupal.org/project/pathauto
- Security advisories: https://www.drupal.org/security
- Drupal 11 API: https://api.drupal.org/api/drupal/11.x

Prefer stable releases covered by Drupal's security advisory policy. Recheck Drupal 11 and installed-core compatibility before changing Composer constraints.

## Search and structured data

- Google Search Essentials: https://developers.google.com/search/docs/essentials
- Canonical URLs: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- JavaScript SEO: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Robots meta and headers: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- Sitemaps: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Structured-data policies: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Supported structured data: https://developers.google.com/search/docs/appearance/structured-data/search-gallery
- Site names and `WebSite`: https://developers.google.com/search/docs/appearance/site-names
- Schema.org vocabulary: https://schema.org/docs/schemas.html
- Bing Webmaster Guidelines: https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a

Validator success proves syntax, not truthfulness, eligibility, or usefulness. Verify current requirements for each structured-data type before implementing it.

## Nuxt image delivery

- Nuxt Image usage and `useImage`: https://image.nuxt.com/usage/use-image
- Nuxt Image configuration and providers: https://image.nuxt.com/get-started/configuration
- Google image SEO and crawlable image URLs: https://developers.google.com/search/docs/appearance/google-images

Keep social-image URLs absolute and crawlable. Confirm the active Nuxt Image provider and CDN contract in the rendered SSR output rather than inferring it from environment variables alone.

## Nuxt sitemap delivery

- Nuxt Sitemap: https://nuxtseo.com/docs/sitemap/getting-started/introduction

Verify the installed module version and rendered `/sitemap.xml`; do not infer public sitemap behavior from Drupal configuration alone.
