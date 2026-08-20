---
name: stir-decoupled-seo
description: Implement, review, migrate, or debug technical SEO for Stir Drupal 11 and Nuxt decoupled sites. Use for metadata, titles, descriptions, canonical URLs, robots directives, XML sitemaps, redirects, Pathauto aliases, Open Graph, social cards, Schema.org/JSON-LD, hreflang, previews, SEO APIs, cache invalidation, launch checks, or indexing problems.
---

# Stir Decoupled SEO

Use Drupal as the editorial source of truth and Nuxt SSR as the public delivery layer. Treat the rendered public response—not configuration alone—as the acceptance surface.

## Establish context

1. Read the repository `AGENTS.md` and its required Drupal skill.
2. Identify source and installed package copies before editing. Put reusable Drupal behavior in `stir-tools/modules/stir_seo` or `stir_sitemap`, portable recipes in `stir-decoupled`, and client-specific models and organization data in the client project.
3. Record the production frontend origin, Drupal origin, languages, indexable environments, content types, and redirect/sitemap ownership.
4. Inspect the Drupal page response or SEO endpoint and Nuxt server-rendered HTML before proposing changes.
5. Read [current-sources.md](references/current-sources.md) for version-sensitive guidance and verify live sources before dependency or search-feature decisions.

## Preserve ownership

- Keep global editorial defaults in Drupal Metatag configuration and expose reusable global head data through `stir_seo`.
- Keep page-specific title, description, canonical, social URL, robots state, alternates, and structured data attached to their owning page response.
- Do not let global fallbacks overwrite page-specific metadata.
- Render critical metadata in initial Nuxt SSR HTML; do not rely on hydration.
- Emit one public canonical identity. Never expose the Drupal backend origin when Nuxt owns the public site.
- Make canonical links, internal links, redirects, sitemap URLs, social URLs, and structured-data URLs agree.
- Keep Drupal `/api/sitemap` as the backend source and Nuxt `/sitemap.xml` as the public artifact unless the project documents another contract.

## Implement deliberately

1. Prefer supported, security-covered Drupal modules and APIs over bespoke replacements: Metatag, Pathauto, Redirect when required, Simple XML Sitemap, and Schema.org Metatag when structured data is editorially managed.
2. Add structured-data types only where the content model supplies truthful properties. Do not install every Schema.org submodule or invent facts.
3. Generate `WebSite` and appropriate `Organization` or `LocalBusiness` data from one site-wide source. Generate page types such as `Article`, `Event`, `JobPosting`, `Product`, `VideoObject`, or `BreadcrumbList` only for matching content.
4. Give indexable pages unique descriptive titles and useful descriptions, using token defaults as fallbacks with editorial overrides.
5. Use absolute self-referential canonicals. Normalize scheme, host, trailing slash, query handling, pagination, aliases, and front-page identity.
6. Use permanent redirects for retired URLs. Avoid chains, loops, soft 404s, and irrelevant destinations.
7. Use `noindex` for pages excluded from search. Do not use `robots.txt` for canonicalization or de-indexing. Prevent indexing outside production.
8. Include only canonical, indexable, successful URLs in the public sitemap. Preserve absolute production URLs and correct language alternates.
9. Provide stable absolute social-image URLs with dimensions, MIME type, and descriptive alt text.
10. Preserve cache tags, contexts, and max-age through Drupal endpoints and Nuxt caches. Document how Drupal changes refresh public artifacts.

## Deliver media through the frontend

- Treat Drupal media URLs as source references, not necessarily the final public delivery URLs.
- Route content images through Nuxt Image/IPX. When `NUXT_IMAGE_CDN` is configured, let it provide the public `/_ipx/` origin; when absent, use the public Nuxt origin.
- Let Drupal supply the editorial source for global and page-specific social images, then render crawlable absolute `og:image`, `twitter:image`, and `image_src` URLs through Nuxt Image/IPX. Preserve page-specific metadata over global fallbacks.
- Keep Drupal as the single source for favicon, touch-icon, and manifest metadata and files; pass those URLs through unchanged without copying them into Nuxt `public` or routing them through IPX.
- Prefer a Drupal-provided revision in a social-image source URL when a stable file path can change in place; do not hard-code per-file revisions in downstream Nuxt configuration.
- Do not introduce `DRUPAL_CDN`, Drupal `file_public_base_url` overrides, or a dependency on `stir_cdn` solely to deliver these frontend assets. Audit existing `stir_cdn` responsibilities before removing it from an established site.
- For an existing site, update its shared Nuxt layer lock reference deliberately; do not modify client sites merely because the reusable skill changed. Non-indexable apps may explicitly disable global SEO behavior.
- Verify both modes: without `NUXT_IMAGE_CDN`, social images must use absolute frontend-hosted IPX URLs; with it, they must use the configured CDN origin. Drupal favicon and manifest URLs must remain unchanged in both modes.

## Validate every layer

For the homepage, each indexable content type, listings, pagination/filter variants, translations, redirects, errors, and preview/draft routes, verify:

1. HTTP status, redirect target, and absence of chains.
2. Drupal-resolved metadata and cacheability dependencies.
3. Nuxt SSR source contains exactly one correct title, description, canonical, robots directive, and intended social tags.
4. Structured data parses, uses public URLs, matches visible content, and has no duplicate or conflicting entities.
5. Sitemap entries resolve successfully and agree with canonical and hreflang output.
6. Internal links use canonical aliases rather than backend or duplicate paths.
7. Metadata edits reach public HTML through targeted invalidation without a blanket cache clear.
8. Tests cover contracts, cacheability, front-page normalization, invalid configuration, and duplicate prevention. Run repository-required PHPCS, static analysis, deprecation, unit, and applicable browser checks.

## Audit and report

Classify findings as indexing/canonical risk, structured-data correctness, social presentation, cache/freshness, accessibility/content quality, or maintainability. Separate verified defects from recommendations. Report the affected layer, rendered evidence, owner, fix, validation, migration/config impact, and residual risk.

Do not promise rankings or maximize tag count. Make public content accurate, discoverable, consistent, accessible, and maintainable.
