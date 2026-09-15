# Starting and maintaining a Stir consumer

Install one reviewed revision as `@stir/base`, declare Nuxt in the application, and commit its lockfile. See the [installation example](../readme.md#downstream-projects). Extend the installed package rather than a second GitHub URL.

| Requirement | Starting point |
|---|---|
| Marketing site with editing, forms, analytics and auth support | `@stir/base` (current complete profile) |
| Same explicit complete profile | `@stir/base/presets/full` |
| Read-only Drupal site without editorial, Webform, auth or privacy-popup integrations | `@stir/base/presets/minimal`, plus `@stir/base/layers/seo/nuxt.config` if it must be indexed |

The minimal theme still supports its existing media, calendar and calculator widgets. Their script loading uses Nuxt Scripts, owned by the theme. An excluded integration does not become enabled merely because the script loader exists.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['@stir/base'],
})
```

Set `DRUPAL_URL` to the Drupal origin, `DRUPAL_API_KEY` to the private CE/API credential and `NUXT_URL` to the public frontend origin. Configure `NUXT_NAME`, `NUXT_ENV`, `NUXT_INDEXABLE`, `SERVER_DOMAIN_CLIENT` and, when forms/auth require CAPTCHA, `TURNSTILE_KEY` and private `TURNSTILE_SECRET` as documented in the [environment reference](../readme.md#-environment-variables). Never put the API key or Turnstile secret in `runtimeConfig.public`.

`NUXT_PUBLIC_DRUPAL_CE_DRUPAL_BASE_URL` and `NUXT_PUBLIC_DRUPAL_CE_SERVER_DRUPAL_BASE_URL` can override Drupal origins at runtime. Match them deliberately to the deployment; don't ship localhost/DDEV values to production. The CE format remains `explicit`, and the existing CE/menu endpoints remain unchanged.

## Applications (not indexed)

Tools, portals, calculators and other applications that must never appear in search results use the same layer with a narrower composition:

- Extend only the capability layers the application needs, for example `@stir/base/layers/auth/nuxt.config`, `@stir/base/layers/webform/nuxt.config`, `@stir/base/layers/editorial/nuxt.config`, `@stir/base/layers/listing/nuxt.config` or `@stir/base/layers/integrations/nuxt.config`. Each brings the shared base it needs. Do not add the SEO or analytics layers, or a preset that includes them.
- Set `ssr: false` when the application renders only for signed-in or embedded use and gains nothing from server-rendered HTML.
- Keep the normal `NUXT_ENV` for each environment. Application mode is automatic when the SEO layer is not extended: the build is never indexable, including with `NUXT_ENV=production`, so no `NUXT_INDEXABLE` setting is needed. `NUXT_INDEXABLE=false` is only for temporarily hiding a website that includes the SEO layer.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: false,
  extends: [
    '@stir/base/layers/auth/nuxt.config',
    '@stir/base/layers/webform/nuxt.config',
  ],
})
```

Every composition loads the foundation layer, which registers `@nuxtjs/robots`. In application mode, or on a website with indexing disabled, the layer enforces:

- `X-Robots-Tag: noindex, nofollow` on application responses
- a plain-text `/robots.txt` with `User-agent: *` and `Disallow: /`
- `<meta name="robots" content="noindex, nofollow">` in every document, including client-rendered ones
- in application mode, a plain 404, not the application shell, for `/sitemap.xml`, `/sitemap_index.xml` and `/__sitemap__/**`, because no sitemap exists without the SEO layer

After deploying, check `/`, `/robots.txt` and `/sitemap.xml` on each environment. Do not keep a `public/robots.txt`: at build time the module moves it to `public/_robots.txt` and merges its rules.

## Drupal is the content and editorial source of truth

Drupal owns authored content, entity access, editorial configuration, presentation payloads and content cache policy. Nuxt consumes those contracts and owns rendering, browser interaction, accessibility and its own request boundaries. Preserve explicit Drupal values; use shared frontend defaults only when a value is absent. Keep visitor preferences such as pausing motion local to the browser. Avoid copying Drupal business or editorial rules into client configuration; propose a producer contract change when data is missing. The separate Nuxt protected-password gate remains an optional frontend feature, not a second Drupal user system.

## Customize the smallest surface

Put project content, branding and custom routes in the application. Put reusable Drupal behavior in Stir Tools and reusable frontend behavior in this layer.

```ts
// app/app.config.ts
export default defineAppConfig({
  ui: { colors: { primary: 'blue', neutral: 'slate' } },
})
```

A project `app/components/EditLink.vue` overrides the shared `EditLink`. The same applies to `DrupalTabs` and `AppIntegrations`, including components supplied by a project-owned Nuxt layer. Do not set high registration priorities to defeat the base layer. Minimal fallback components remain empty; full/root profiles supply their actual implementations unless the consumer overrides them.

If owning `app/assets/css/main.css`, retain:

```css
@import '@stir/base/layers/theme/app/assets/css/main';
```

Use `#stir/utils`, `#stir/composables`, `#stir/components` and `#stir/types` for explicit shared imports. Legacy aliases remain supported; see the [consumer inventory](consumer-compatibility-2026-09-06.md). Avoid copying entire shared components for a color or spacing change.

`spaLoadingTemplate: false` now truly disables the loader. A custom template path and the existing themed default remain supported. The loader is an initial document fallback, not a replacement for route-specific pending UI.

Horizontal Drupal marquees render two content copies by default to avoid hydrating unnecessary duplicate descendants. Vertical marquees retain four. Set `stirTheme.carousel.marqueeRepeat` in `app/app.config.ts` only when a project needs different repetition:

```ts
export default defineAppConfig({
  stirTheme: {
    carousel: {
      marqueeRepeat: { horizontal: 4, vertical: 4 },
    },
  },
})
```

Use whole-number counts of at least two for continuous scrolling. If overriding Nuxt UI's marquee content width or layout, verify coverage throughout the animation at mobile and wide desktop sizes. Drupal still controls the content, direction and duration; this setting only controls repeated rendering copies.

## Media and presentation prerequisites

Configure Drupal/CDN image origins, and keep canonical original image URLs plus source revisions in the Drupal payload. Immutable image caching assumes versioned source keys: replacing an image must change its revision/URL. Keep the existing presentation-manifest export available at build time, or provide a reviewed snapshot through `STIR_PRESENTATION_MANIFEST`. Do not use the repository fixture as a production manifest.

| Symptom | First useful check |
|---|---|
| Presentation manifest request/schema failure | Drupal origin, server API key, producer version and snapshot revision |
| Blank custom element | Filename/CE mapping and installed capability profile |
| Component override seems ignored | Use the normal component name/path; regenerate Nuxt types and check selected implementation |
| CMS page/menu times out | Backend health and `DRUPAL_REQUEST_TIMEOUT_MS` (default 10 seconds) |
| Webform receives 413 | Wire-body, per-file, field/file count limits and ingress upload cap |
| Protected login receives 429/503 | Attempt window or shared atomic limiter availability; see the auth guide |
| Unexpected cache revalidation | Drupal's explicit cache policy now survives the proxy; only missing policy gets the shared fallback |

## Verify and roll out

In the shared layer, run `STIR_E2E_BROWSER=true pnpm verify:ci`. It checks runtime behavior, lint/types, production builds and independently installed root/minimal/full consumers. See the [measurement and budget policy](performance-budgets.md). CI reuses the core build for bundle analysis; editorial code in the initial static graph fails, while the documented historical size overruns are warnings. Route transfer and timing require Lighthouse measurements separately.

In a consuming application, run its `pnpm verify:ci`, then verify staging home, an inner Drupal page, menus, a form submission, login/private cache headers, and editorial read/update if enabled. Confirm carousel keyboard pause/resume, reduced motion, image revisions and browser console/hydration behavior. Production deployment is a separate rollout decision.
