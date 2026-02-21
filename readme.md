# Nuxt 4 Drupal Layer (Nuxt UI 4 + Tailwind 4)

A production-ready Nuxt 4 layer/base theme for decoupled Drupal (Lupus Custom Elements) sites.  
Built with Nuxt UI 4 and Tailwind CSS 4 for SSR-friendly, SEO-aware, content-driven web apps.

Use this if you need a reusable Nuxt starter for Drupal-backed marketing sites, content hubs, and custom page-builder experiences.

## 🚀 Features

- ✅ **Nuxt 4** with full SSR and Vite support
- 🎨 **Nuxt UI 4** with customized design tokens, material-style form variants, and Tailwind 4
- 🧩 **Drupal CE** integration for decoupled content, slot-based layouts, and dynamic form rendering
- 📊 Turnstile CAPTCHA, Sitemap, and Robots support
- 🌀 Smooth scrolling and page transitions
- ⚙️ Vitalizer: Delayed hydration for performance optimization
- 🔐 Environment-aware route rules, protected admin redirects
- 🧪 ESLint, Prettier, and Release It pre-configured
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

- **[Nuxt 4](https://nuxt.com/)**: `^4.3.1`
- **[Nuxt UI 4](https://ui.nuxt.com/)**: pinned PR build `@nuxt/ui@6e66015`
- **[Tailwind CSS 4](https://tailwindcss.com/)**: `^4.2.0`
- **[nuxtjs-drupal-ce](https://github.com/drunomics/nuxtjs-drupal-ce)**: `^2.5.3`
- **[Vite](https://vitejs.dev/)** + **[Nitro](https://nitro.unjs.io/)**: provided by Nuxt build/runtime for asset optimization

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
pnpm test:watch # Run unit tests in watch mode
pnpm verify:ci  # Full local quality gate (test/lint/typecheck/build)
pnpm perf:report # Build + output top client chunk size report
pnpm deps:update:safe # Safe dependency update flow
pnpm release    # Tag + prepare release
```

## ✅ Pre-Merge Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Dependency Update Policy

Use `pnpm deps:update:safe` for routine updates.  
See `docs/dependency-update-policy.md` for the full policy.

## Release Checklist

Use `docs/release-checklist.md` as the standard pre-merge/pre-release checklist.
