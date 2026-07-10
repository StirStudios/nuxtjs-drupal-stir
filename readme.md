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

```bash
pnpm install
pnpm dev
```

Then configure environment variables (see `## 🔐 Environment Variables`) and app-level options in `app/app.config.ts`.

## 🧱 Tech Stack

<!-- tech-stack:start -->
- **[Nuxt 4](https://nuxt.com/)**: `^4.4.8`
- **[Nuxt UI 4](https://ui.nuxt.com/)**: `^4.9.0`
- **[Tailwind CSS 4](https://tailwindcss.com/)**: `^4.3.2`
- **[nuxtjs-drupal-ce](https://github.com/drunomics/nuxtjs-drupal-ce)**: `^2.6.3`
- **[Vite](https://vitejs.dev/)** + **[Nitro](https://nitro.unjs.io/)**: provided by Nuxt build/runtime for asset optimization
<!-- tech-stack:end -->

## ✅ Quality Baseline

- Linting: `pnpm lint` (ESLint)
- Type safety: `pnpm typecheck` (Nuxt + Vue TS)
- Unit testing: `pnpm test` (Vitest)
- Nuxt runtime testing: `pnpm test:nuxt` (Nuxt test-utils + Vitest)
- CI/local gate: `pnpm verify:ci` (test + test:nuxt + lint + typecheck + build)
- Bundle/perf visibility: `pnpm perf:report`

## 📦 Project Structure

- `nuxt.config.ts` — Root orchestration for layers, modules, runtime config, routing, and build
- `layers/core` — Server/runtime Drupal integration and backend proxy endpoints
- `layers/theme` — UI components, layouts, composables, utilities, app config, and CSS
- `layers/auth` — Optional Drupal auth/account UI, middleware, and proxy endpoints
- `server/utils` — Shared Nitro utilities reused by multiple layers

## 🔐 Environment Variables

- `DRUPAL_URL`: Base Drupal URL (for CE and API calls), e.g. `https://cms.example.com`
- `DRUPAL_API_KEY`: Optional API key for secured server-side Drupal requests
- `PROTECTED_PASSWORD`: Server-only password used by the lightweight `/auth/protected` gate
- `NUXT_URL`: Public site URL used by SEO modules, e.g. `https://www.example.com`
- `NUXT_NAME`: Site name used in SEO/meta defaults
- `NUXT_ENV`: Environment label (for example `development`, `staging`, `production`)
- `NUXT_INDEXABLE`: Indexability switch (`'false'` disables production indexing behavior while keeping sitemap routes available for verification)
- `SERVER_DOMAIN_CLIENT`: Trusted frontend domain for server-side origin/cookie handling
- `NUXT_PUBLIC_PLAUSIBLE_DOMAIN`: Public Plausible site domain override, e.g. `example.com`
- `NUXT_PUBLIC_PLAUSIBLE_API_HOST`: Public Plausible API host override, e.g. `https://analytics.example.com`
- `TURNSTILE_KEY`: Cloudflare Turnstile site key (public widget key)
- `TURNSTILE_SECRET`: Cloudflare Turnstile secret key (server-side verification)

Notes:
- `DRUPAL_API_KEY` is forwarded by server endpoints that call Drupal backend APIs (`x-api-key` header).
- Turnstile verification for webform submissions is enforced in Drupal (`stir_webform_rest`); this layer requires token presence before forwarding.
- `site.indexable` and Plausible runtime enablement require `NUXT_ENV=production` and `NUXT_INDEXABLE !== 'false'`.
- Sitemap routes remain registered in non-indexable environments so `/sitemap.xml` can be checked during development and staging; non-indexing is controlled separately through `site.indexable`/robots behavior.
- Auth/session source of truth is server endpoint `/api/auth/session`.

## Auth + Account Integration (stir_account)

Auth/account and password-protected page features live in the optional sub-layer:
`layers/auth`.

In this repository, auth is enabled by default through:

```ts
// nuxt.config.ts
extends: ['./layers/auth']
```

Drupal account auth is disabled by default. If a downstream project does not
need any auth routes or APIs, remove that `extends` entry.
Core webform submission and Drupal CSRF forwarding do not depend on the auth layer.
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
See [Validation Architecture](./docs/validation.md) for Yup validation flow across webforms and auth/account forms.
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
pnpm test:e2e   # Run E2E smoke tests (optional/local)
pnpm test:watch # Run unit tests in watch mode
pnpm verify:ci  # Full local quality gate (test/test:nuxt/lint/typecheck/build)
pnpm perf:report # Build + output top client chunk size report
pnpm deps:update:safe # Safe dependency update flow
pnpm release    # Tag + prepare release
```

## ✅ Pre-Merge Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:nuxt
pnpm build
```

## Dependency Update Policy

Use `pnpm deps:update:safe` for routine updates.
See `docs/dependency-update-policy.md` for the full policy.

## Plausible Migration Note (April 1, 2026)

- Plausible tracking now uses `@nuxtjs/plausible`.
- Layer-level `analytics.plausible` only overrides `enabled` and `domain`; runtime defaults live in `nuxt.config.ts`.
- `analytics.plausible.scriptUrl` and `analytics.plausible.scriptId` are removed.
- Use `NUXT_PUBLIC_PLAUSIBLE_API_HOST` (or `proxy: true`) with `domain` for endpoint/domain control.

## Release Checklist

Use `docs/release-checklist.md` as the standard pre-merge/pre-release checklist.
