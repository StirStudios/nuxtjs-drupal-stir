# Nuxt 4 Drupal Layer (Nuxt UI 4 + Tailwind 4)

![Nuxt](https://img.shields.io/badge/Nuxt-4.x-00DC82?logo=nuxt.js&logoColor=white)
![Nuxt UI](https://img.shields.io/badge/Nuxt%20UI-4.x-00DC82?logo=nuxt.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.x-38BDF8?logo=tailwindcss&logoColor=white)

A production-ready Nuxt 4 layer/base theme for decoupled Drupal (Lupus Custom Elements) sites.
Built with Nuxt UI 4 and Tailwind CSS 4 for SSR-friendly, SEO-aware, content-driven web apps.

Use this if you need a reusable Nuxt starter for Drupal-backed marketing sites, content hubs, and custom page-builder experiences.

## 🚀 Features

- ✅ **Nuxt 4** with full SSR and Vite support
- 🎨 **Nuxt UI 4** with customized design tokens, material-style form variants, and Tailwind 4
- 🧩 **Drupal CE** integration for decoupled content, slot-based layouts, paragraph mapping, and dynamic form rendering
- 🖼️ Rich media support with overlays, modal/gallery display, and content-driven image handling
- 🧱 Flexible content patterns including layout sections, carousel/tabs, and masonry-style gallery implementations in downstream themes
- 📝 Full Drupal webform rendering flow with schema-based validation and SSR-safe behavior
- 📊 Built-in integrations for Turnstile CAPTCHA, Plausible analytics, Sitemap, and Robots
- ♿ Accessibility-focused defaults (form labeling, semantics, keyboard-aware UI, contrast-friendly text tokens)
- 🌀 Smooth scrolling and page transitions
- ⚙️ Vitalizer: LCP-focused prefetch and stylesheet optimization
- 🔐 Unified Drupal auth UI/routes (`/auth/*`) and optional password-protected route gate
- 🧪 ESLint, TypeScript checks, Vitest, and Release It pre-configured
- 📁 Cloudflare-optimized asset compression via Nitro

## 👥 Who This Is For

- Teams building decoupled Drupal + Nuxt websites
- Agencies shipping reusable Nuxt layers across multiple client projects
- Projects that need SSR, sitemap/robots support, webforms, and strong accessibility defaults

## ⚡ Quick Start

Use Node `22.13+`, `24.11+`, or `26+` and the repository-declared pnpm version.

```bash
pnpm install
pnpm dev
```

Then configure environment variables (see `## 🔐 Environment Variables`) and app-level options in `app/app.config.ts`.

### Downstream projects

Install the layer once under its package name, then extend that installed
package. Keep the Git branch, tag, or commit in `package.json`; do not repeat a
GitHub source in `nuxt.config.ts`.

```json
{
  "dependencies": {
    "@stir/base": "github:StirStudios/nuxtjs-drupal-stir#vnext",
    "nuxt": "^4.4.8"
  }
}
```

```ts
export default defineNuxtConfig({
  extends: ['@stir/base'],
})
```

When an application owns `app/assets/css/main.css`, that file intentionally
replaces the layer CSS entry. Import the stable package export before project
styles; do not reach into a relative `node_modules` path:

```css
@source '@stir/base';
@import '@stir/base/layers/theme/app/assets/css/main';

@import './base';
@import './utilities';
```

Tailwind CSS 4 does not support responsive variants inside `@apply`. Put the
responsive declaration in its media query instead of using, for example,
`@apply text-3xl sm:text-5xl`.

Pin production projects to a reviewed tag or commit. A branch reference is
appropriate while testing vNext, but it should not be the production lock.
Nuxt is an intentional required peer: every application owns its Nuxt runtime
version directly, while this repository keeps the same range as a development
dependency for layer builds and tests.
The package uses Nuxt's `dev:prepare` convention and does not run a lifecycle
build when installed as a dependency. pnpm 11 applications must still keep
their own `onlyBuiltDependencies` policy in `pnpm-workspace.yaml` for native
dependencies such as `esbuild`, `@parcel/watcher`, and `unrs-resolver`; package
manager security policy belongs to the consuming application and is not
inherited from a layer.
Extending `github:StirStudios/nuxtjs-drupal-stir#...` directly while also
installing `@stir/base` is unsupported because Nuxt and the package manager can
resolve different revisions of the same layer.

## 🧱 Tech Stack

<!-- tech-stack:start -->
- **[Nuxt 4](https://nuxt.com/)**: `^4.4.8`
- **[Nuxt UI 4](https://ui.nuxt.com/)**: `^4.9.0`
- **[Tailwind CSS 4](https://tailwindcss.com/)**: `^4.3.2`
- **[nuxtjs-drupal-ce](https://github.com/drunomics/nuxtjs-drupal-ce)**: `^2.7.0`
- **[Vite](https://vitejs.dev/)** + **[Nitro](https://nitro.unjs.io/)**: provided by Nuxt build/runtime for asset optimization
<!-- tech-stack:end -->

## ✅ Quality Baseline

- Linting: `pnpm lint` (ESLint)
- Type safety: `pnpm typecheck` (Nuxt + Vue TS)
- Unit testing: `pnpm test` (Vitest)
- Nuxt runtime testing: `pnpm test:nuxt` (Nuxt test-utils + Vitest)
- E2E smoke testing: `pnpm test:e2e` (built Nuxt health/runtime smoke)
- Consumer compatibility: `pnpm test:consumer` (fixture typecheck + production build)
- Real consumer pilots: `STIR_CONSUMER_RSF=/path/to/rsf-nuxt pnpm audit:consumers rsf --verify` (archives committed source into a disposable directory, installs the packed layer and its declared Nuxt peer, then typechecks/builds without changing the project checkout)
- Accessibility auditing: `pnpm test:a11y` (Playwright + axe across responsive and color-scheme states)
- CI/local gate: `pnpm verify:ci` (all tests, lint, typecheck, root build, and consumer checks)
- Bundle/perf visibility: `pnpm perf:report`

### Accessibility audits in downstream projects

The package exposes the reusable `stir-a11y` command. Add these scripts to a
downstream project's `package.json` (package scripts are not inherited through
Nuxt layers):

```bash
pnpm add -D @axe-core/playwright@^4.12.1 @playwright/test@^1.61.1
```

```json
{
  "scripts": {
    "test:a11y": "stir-a11y",
    "test:a11y:install": "stir-a11y install chromium",
    "test:a11y:report": "stir-a11y show-report playwright-report"
  }
}
```

Run `pnpm test:a11y:install` once, then `pnpm test:a11y`. The portable default
starts the downstream's Nuxt dev server and scans `/` in desktop/mobile and
light/dark modes. Configure a deployed target and representative routes with:

```bash
A11Y_BASE_URL=https://www.example.com \
  A11Y_ROUTES=/,/about,/contact pnpm test:a11y
```

Supported audit configuration:

- `A11Y_BASE_URL`: scan an existing site and skip the managed local server.
- `A11Y_ROUTES`: comma-separated route list; defaults to `/`.
- `A11Y_SERVER_URL`: managed local server URL; defaults to `http://127.0.0.1:4173`.
- `A11Y_SERVER_COMMAND`: managed server command; defaults to `pnpm dev --host 127.0.0.1 --port 4173`.
- `A11Y_USE_FIXTURE`: set to `true` only when the packaged deterministic Drupal fixture should replace the downstream backend; enabled automatically when auditing this base repository.
- `A11Y_HOVER_SELECTOR`: controls whose completed hover states are scanned; defaults to `[data-a11y-scan-hover]`.
- `A11Y_OPAQUE_SELECTOR`: controls that must expose an opaque resting background; defaults to `[data-a11y-scan-opaque]`.
- `A11Y_STATE_SETTLE_MS`: interaction settling time; defaults to `350`.
- `A11Y_MOTION_SETTLE_MS`: entrance-animation settling time before baseline and interaction scans; defaults to `1200`.

The audit scrolls through lazy/viewport content and checks WCAG 2 A/AA,
WCAG 2.1/2.2 AA, and axe best practices. Failures include affected selectors,
current contrast values, and nearest passing foreground/background suggestions.
Full axe JSON, screenshots, traces, and an HTML report are written to the
downstream project. Opt into animation-state coverage with the generic data
attributes above; the harness does not depend on project-specific components.

## 📦 Project Structure

- `nuxt.config.ts` — Root orchestration for layers, modules, runtime config, routing, and build
- `layers/foundation` — Shared Nuxt UI, validation, Drupal request security, session privacy, and baseline CSS
- `layers/platform` — Drupal CE website renderer composed from foundation, core, and theme
- `layers/core` — Server/runtime Drupal integration and backend proxy endpoints
- `layers/theme` — UI components, layouts, composables, utilities, app config, and CSS
- `layers/seo` — Optional sitemap and Drupal-owned global metadata
- `layers/listing` — Optional provider-neutral configured listings
- `layers/auth` — Optional Drupal auth/account UI, middleware, and proxy endpoints
- `layers/webform` — Optional Drupal Webform rendering and submission
- `server/utils` — Shared Nitro utilities reused by multiple layers

## 🔐 Environment Variables

- `DRUPAL_URL`: Base Drupal URL (for CE and API calls), e.g. `https://cms.example.com`
- `DRUPAL_API_KEY`: Optional API key for secured server-side Drupal requests
- `DRUPAL_SESSION_COOKIE_NAMES`: Optional comma-separated allowlist for deployments that override Drupal's standard session cookie name
- `DRUPAL_FORWARD_CLIENT_IP`: Set to `'true'` to forward a normalized client IP on auth/account proxy calls (default: `false`)
- `DRUPAL_TRUST_PROXY`: Set to `'true'` only when a trusted ingress replaces `X-Forwarded-For` and `DRUPAL_FORWARD_CLIENT_IP` is enabled (default: `false`)
- `PROTECTED_PASSWORD`: Server-only password used by the lightweight `/auth/protected` gate; requires the Turnstile keys below
- `PROTECTED_RATE_LIMIT_ENABLED`: Set to `'false'` to disable the protected-login limiter (default: enabled)
- `PROTECTED_RATE_LIMIT_MAX_ATTEMPTS`: Failed attempts allowed per window (default: `5`)
- `PROTECTED_RATE_LIMIT_WINDOW_SECONDS`: Protected-login window in seconds (default: `900`)
- `PROTECTED_RATE_LIMIT_TRUST_PROXY`: Set to `'true'` only behind an ingress that replaces, rather than appends to, `X-Forwarded-For` (default: `false`)
- `DRUPAL_REQUEST_TIMEOUT_MS`: Timeout for custom Nitro-to-Drupal requests in milliseconds (default: `10000`)
- `WEBFORM_MAX_REQUEST_BYTES`: Maximum webform request size (default: `10485760`, 10 MB)
- `WEBFORM_MAX_FILE_BYTES`: Maximum size of one webform upload (default: `5242880`, 5 MB)
- `WEBFORM_MAX_FILES`: Maximum files per webform submission (default: `5`)
- `WEBFORM_MAX_FIELDS`: Maximum non-file multipart fields per submission (default: `100`)
- `NUXT_URL`: Public site URL used by SEO modules, e.g. `https://www.example.com`
- `NUXT_NAME`: Site name used in SEO/meta defaults
- `NUXT_ENV`: Environment label (for example `development`, `staging`, `production`)
- `NUXT_INDEXABLE`: Indexability switch (`'false'` disables production indexing behavior while keeping sitemap routes available for verification)
- `NUXT_IMAGE_DOMAINS`: Space-separated remote image hostnames that Nuxt Image/IPX may retrieve, including the Drupal asset hostname
- `NUXT_IMAGE_CDN`: Optional absolute CDN origin for Nuxt/IPX derivatives, e.g. `https://images.example.com`; its pull origin must be the Nuxt application and Bunny Optimizer is not required
- `STIR_IMAGE_DELIVERY`: Set to `drupal` only to restore legacy Drupal responsive-image delivery; Nuxt Image/IPX is the default
- `SERVER_DOMAIN_CLIENT`: Development-only host allowed by the Vite dev server
- `NUXT_PUBLIC_PLAUSIBLE_DOMAIN`: Public Plausible site domain override, e.g. `example.com`
- `NUXT_PUBLIC_PLAUSIBLE_API_HOST`: Public Plausible API host override, e.g. `https://analytics.example.com`
- `TURNSTILE_KEY`: Cloudflare Turnstile site key (public widget key)
- `TURNSTILE_SECRET`: Cloudflare Turnstile secret key (server-side verification)

Notes:

- `DRUPAL_API_KEY` is injected automatically only for the internal Drupal CE and menu proxies. Custom server endpoints add it explicitly when calling Drupal; unrelated `/api/*` routes never receive it.
- Deployed runtime overrides supported by `nuxtjs-drupal-ce` include `NUXT_PUBLIC_DRUPAL_CE_DRUPAL_BASE_URL`, `NUXT_PUBLIC_DRUPAL_CE_SERVER_DRUPAL_BASE_URL`, `NUXT_PUBLIC_DRUPAL_CE_MENU_BASE_URL`, and `NUXT_PUBLIC_DRUPAL_CE_CE_API_ENDPOINT`.
- Turnstile verification for webform submissions is enforced in Drupal (`stir_webform_rest`); this layer requires token presence before forwarding.
- The local `/auth/protected` password gate verifies Turnstile server-side before checking the configured password. Its Nitro limiter is best-effort and non-atomic; production must independently enforce a persistent, atomic or provider-native edge rule for `POST /api/auth/protected` using a trusted client-IP boundary.
- Protected-access cookies are signed with `PROTECTED_PASSWORD`; rotating the password immediately invalidates every existing protected session.
- H3 buffers multipart bodies before application-level file checks. The Nuxt limits are validation, not a pre-buffer memory cap; production must reject fixed-length and chunked multipart bodies at or below `WEBFORM_MAX_REQUEST_BYTES` before they reach Nitro.
- Align `WEBFORM_MAX_*` with the largest deployed Drupal Webform and its PHP/Webform upload limits before rollout; submissions over the Nuxt limits return `413`.
- When Drupal Flood limits must see the original visitor IP, enable the two `DRUPAL_*CLIENT_IP/TRUST_PROXY` controls only after the ingress replaces forwarded headers and Symfony trusts the Nuxt proxy address.
- `site.indexable` and Plausible runtime enablement require `NUXT_ENV=production` and `NUXT_INDEXABLE !== 'false'`.
- When the SEO capability is selected, sitemap routes remain registered in non-indexable environments so `/sitemap.xml` can be checked during development and staging; non-indexing is controlled separately through `site.indexable`/robots behavior.
- Auth/session source of truth is server endpoint `/api/auth/session`.
- Cookie-authenticated account changes and paragraph updates require same-origin browser evidence based on `NUXT_URL`.

## Auth + Account Integration (stir_account)

Auth/account and password-protected page features live in `layers/auth`. The
published root and full preset include it for compatibility. Capability-focused
applications may consume the auth layer directly; it brings the shared
platform and mandatory Turnstile capability with it.

In this repository, auth is enabled by default through:

```ts
// nuxt.config.ts
extends: ['@stir/base/layers/auth/nuxt.config']
```

Drupal account auth is disabled by default through app config. Use
`@stir/base/presets/minimal` for the shared renderer without optional auth,
Webform, SEO, editorial, analytics, scripts, or integration capabilities. Core
Webform submission and Drupal CSRF forwarding remain independent of account
auth.
If it only needs password-protected Nuxt pages, keep the layer and leave
`authIntegration.drupalAccounts` unset or set it to `false` in app config.
Set `authIntegration.drupalAccounts: true` only for projects that provide the
Drupal `stir_account` endpoints.

When enabled, the auth layer is aligned with `stir_account` endpoints and uses `/auth/*` pages:

- `/auth/login`
- `/auth/logout`
- `/auth/register`
- `/auth/password/request`
- `/auth/password/reset`
- `/auth/verify`
- `/auth/protected` (optional password-only page gate)

Behavior notes:

- `authIntegration.drupalAccounts: false` disables the account UI routes (`/account/*`, login, register, password reset, verify) while keeping `/auth/protected` available.
- Drupal `/api/auth/config` is the source of truth for account-auth redirects, UI copy, and password policy; frontend values are safe fallbacks only.
- Client auth state comes from `/api/auth/session` only.
- Requests with Drupal `SESS*`/`SSESS*` cookies skip SSR for page routes and return `Cache-Control: private, no-store, max-age=0`; anonymous requests keep normal SSR for SEO.
- Register page visibility follows backend policy (`/api/auth/register-policy`), so Drupal account settings remain the source of truth.
- Password reset and verification links are backend-signed and validated before submit.
- Turnstile tokens are required in auth form submissions when enabled by backend policy.

See [Auth Integration Guide](./docs/auth-integration.md) for endpoint contracts, deployment notes, and rate-limit recommendations.
See [Validation Architecture](./docs/validation.md) for Valibot validation flow across webforms and auth/account forms.
See [Drupal Downstream Contracts](./docs/drupal-downstream-contracts.md) for app-context, Drupal view, media, and theme override expectations.

## 🎨 Styling Conventions

- Prefer nested CSS for readability.
- In scoped styles, use `:global(...)` + `:deep(...)` when targeting global theme/state classes.
- Prefer stable class hooks over ARIA/attribute selectors for reusable styling targets.
- Keep `app/assets/css/custom.css` as an import/index file and place new rules in focused partials under `app/assets/css/custom/`.
- If a custom stylesheet grows past roughly 80-120 lines or mixes concerns, split it during the same change.

## 🛠️ Scripts

```bash
pnpm dev        # Start local dev server
pnpm build      # Build for production
pnpm preview    # Preview production build
pnpm lint       # Lint project
pnpm typecheck  # Nuxt + Vue TypeScript checks
pnpm test       # Run unit tests
pnpm test:nuxt  # Run Nuxt runtime tests
pnpm test:e2e   # Run built Nuxt E2E smoke tests
pnpm test:consumer # Typecheck and build the downstream consumer fixture
pnpm test:all   # Run unit, Nuxt runtime, and E2E tests
pnpm test:watch # Run unit tests in watch mode
pnpm verify:core # Tests, lint, typecheck, and root production build
pnpm verify:ci  # Full gate, including downstream consumer compatibility
pnpm css:generate-safelist # Regenerate Tailwind's CMS-driven inline safelist
pnpm perf:report # Build + output top client chunk size report
pnpm deps:update:safe # Safe dependency update flow
pnpm release    # Tag + prepare release
```

## ✅ Pre-Merge Checks

```bash
pnpm verify:ci
```

This includes unit, Nuxt runtime, E2E, lint, typecheck, root build, and
downstream consumer checks.

## Dependency Update Policy

Use `pnpm deps:update:safe` for routine updates.
See `docs/dependency-update-policy.md` for the full policy.

## Plausible Migration Note (April 1, 2026)

- Plausible tracking now uses `@nuxtjs/plausible`.
- Consent-deferred initialization uses the direct `@plausible-analytics/tracker` runtime.
- Layer-level `analytics.plausible` only overrides `enabled` and `domain`; runtime defaults live in `nuxt.config.ts`.
- `analytics.plausible.scriptUrl` and `analytics.plausible.scriptId` are removed.
- Use `NUXT_PUBLIC_PLAUSIBLE_API_HOST` (or `proxy: true`) with `domain` for endpoint/domain control.
- When `privacyNotice.mode` is `consent`, Plausible does not initialize until the visitor accepts.

See [Runtime Security and Proxy Configuration](./docs/runtime-security.md) for
request limits, proxy trust, cookie forwarding, and Drupal server-origin details.

## Release Checklist

Use `docs/release-checklist.md` as the standard pre-merge/pre-release checklist.
