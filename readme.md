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
- ⚙️ Vitalizer: Delayed hydration for performance optimization
- 🔐 Environment-aware route rules, protected admin redirects
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

- **[Nuxt 4](https://nuxt.com/)**: `^4.4.2`
- **[Nuxt UI 4](https://ui.nuxt.com/)**: `^4.7.1`
- **[Tailwind CSS 4](https://tailwindcss.com/)**: `^4.2.4`
- **[nuxtjs-drupal-ce](https://github.com/drunomics/nuxtjs-drupal-ce)**: `^2.6.1`
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

- `nuxt.config.ts` — Full config for modules, routing, environment, and build
- `app/app.config.ts` — UI theming, layout, animation, and third-party settings
- `assets/css/main.css` — Tailwind CSS entry point
- `utils/uiVariants.ts` — Custom Nuxt UI material variant tokens

## 🔐 Environment Variables

- `DRUPAL_URL`: Base Drupal URL (for CE and API calls), e.g. `https://cms.example.com`
- `DRUPAL_API_KEY`: Optional API key for secured server-side Drupal requests
- `NUXT_URL`: Public site URL used by SEO modules, e.g. `https://www.example.com`
- `NUXT_NAME`: Site name used in SEO/meta defaults
- `NUXT_ENV`: Environment label (for example `development`, `staging`, `production`)
- `NUXT_INDEXABLE`: Indexability switch (`'false'` disables sitemap/robots indexing behavior)
- `SERVER_DOMAIN_CLIENT`: Trusted frontend domain for server-side origin/cookie handling
- `NUXT_PUBLIC_PLAUSIBLE_API_HOST`: Public Plausible API host override, e.g. `https://analytics.example.com`
- `TURNSTILE_KEY`: Cloudflare Turnstile site key (public widget key)
- `TURNSTILE_SECRET`: Cloudflare Turnstile secret key (server-side verification)

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
