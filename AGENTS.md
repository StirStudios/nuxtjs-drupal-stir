# AGENTS.md

This repository is a **Nuxt 4 layer/base theme** using **Nuxt UI 4 + Tailwind 4** with
**Lupus Decoupled Drupal (Custom Elements)** via **nuxtjs-drupal-ce**.
Use these rules for all changes.

## Primary goals
- Keep the layer production-safe for SSR and reusable across downstream projects.
- Preserve Drupal CE compatibility and predictable custom-element rendering.
- Favor explicit, typed, and documented configuration over implicit behavior.

## Project overview
- **Framework:** Nuxt 4 (SSR by default, Nitro runtime)
- **UI:** Nuxt UI 4 + Tailwind CSS 4
- **CMS integration:** `nuxtjs-drupal-ce` (Lupus Decoupled Custom Elements)
- **Performance modules:** `nuxt-vitalizer`
- **Aux modules:** robots, sitemap, turnstile, scripts, eslint

## Repository structure (high level)
- `app/` - Nuxt app code (pages, components, composables, plugins)
- `server/` - Nitro server routes/middleware/utilities
- `assets/` - global CSS and static assets
- `docs/` - integration and project docs
- `types/` - shared TS types/interfaces
- `nuxt.config.ts` - runtime/build/module configuration
- `app.config.ts` - Nuxt UI/theme-level app configuration

## Environment and configuration rules
- Keep `.env`-driven config aligned with `nuxt.config.ts`; avoid hardcoded URLs/secrets.
- If adding/renaming env vars, update `readme.md` and mention in your summary.
- When changed, explicitly document purpose and expected values for:
  - `DRUPAL_URL`
  - `DRUPAL_API_KEY`
  - `NUXT_URL`
  - `NUXT_NAME`
  - `NUXT_ENV`
  - `NUXT_INDEXABLE`
  - `SERVER_DOMAIN_CLIENT`
  - `TURNSTILE_KEY`
  - `TURNSTILE_SECRET`
- Call out runtime overrides via `NUXT_PUBLIC_DRUPAL_CE_*` variables whenever used.
- If route rules/redirects change (for example `/admincontrol` or `/front`), document user-facing impact.

## Coding conventions
- TypeScript-first: prefer typed params, return types, and narrow interfaces near usage.
- Use Nuxt/Vue idioms: composables for shared logic, focused components, minimal cross-layer coupling.
- Prefer Nuxt UI tokens/variants and Tailwind utilities before writing custom CSS.
- Prefer nested CSS for readability when using Tailwind v4 CSS features.
- In scoped styles, use `:global(...)` with `:deep(...)` when targeting global theme/state classes.
- Prefer stable class hooks (for example `app-nav`) over ARIA/attribute selectors for reusable styling targets.
- Treat `app/assets/css/custom.css` as an import/index file; place new styles in focused partials under `app/assets/css/custom/`.
- If custom styles in one file grow beyond roughly 80-120 lines or mix unrelated concerns, split them in the same PR.
- Keep comments minimal and only for non-obvious logic or external constraints.
- Do not wrap imports in `try/catch` (project-wide rule).
- Use single-quoted strings in JS/TS/Vue config and code unless escaping would reduce readability; keep style aligned with ESLint/Prettier.
- In `<script setup>`, group related declarations with a single blank line between logical blocks (imports, props/emits, composables/context, local types, refs/state, computed values, methods/watch/lifecycle). Avoid extra blank lines within a single block.
- Naming:
  - Vue components: PascalCase unless Drupal custom-element mapping requires kebab-case.
  - Composables: camelCase with `use*` naming.
  - Server utilities/routes: clear, purpose-driven names that match Nitro conventions.

## Nuxt UI reference priority
- For Nuxt UI component/composable APIs, props, slots, events, theming, and patterns, prefer official sources in this order:
  - Nuxt UI MCP server: `https://ui.nuxt.com/mcp`
  - Nuxt UI LLM index: `https://ui.nuxt.com/llms.txt`
  - Nuxt UI docs pages (`https://ui.nuxt.com/docs/...`)
- This is recommended guidance, not a hard requirement; do not block work if MCP is unavailable.

## Drupal CE integration guidance
- Prefer existing `nuxtjs-drupal-ce` utilities/composables before custom fetch logic.
- Keep schema and mapping assumptions explicit with types or concise inline notes.
- For custom elements, prefer 1:1 filename mapping in kebab-case
  (example: `node-article-teaser.vue`); fallback components may use `--default` suffix.
- Place globally reused custom-element components in `components/global` when appropriate.
- Default Custom Elements JSON format is `explicit`; use `legacy` only for old backends and document why.
- If changed, document these module options and expected behavior:
  - `drupalBaseUrl`
  - `serverDrupalBaseUrl`
  - `ceApiEndpoint`
  - `customElementJsonFormat`
  - menu endpoint overrides
- Any change affecting Drupal-driven layout/block/custom-element rendering must be clearly called out in summaries.
- If a feature requires new Drupal fields, CE config, or JSON:API include changes, document in `docs/` or `readme.md`.

## SSR, runtime, and performance safeguards
- No browser-only APIs at module top-level.
- Use `import.meta.client`/`import.meta.server` (or Nuxt-safe guards) where runtime-specific logic is required.
- Keep server/client behavior consistent when touching hydration-sensitive UI.
- When changing `nuxt-vitalizer`, hydration timing, or motion behavior, verify no regression in interaction readiness.
- Avoid breaking public interfaces/config defaults unless explicitly requested.

## Validation checklist
Run relevant checks after changes:
- `pnpm lint`
- `pnpm build`
- `pnpm generate` (when static output behavior is affected)
- `pnpm dev` (for local/manual verification when needed)

If checks are skipped, state exactly which were not run and why.

## Release and safety rules
- Do **not** run `pnpm release` unless explicitly requested.
- Do not introduce breaking changes to shared layer contracts without approval.

## PR / handoff expectations
- Summaries must include:
  - user-facing changes
  - Drupal integration impact (if any)
  - config/env changes
  - verification performed (or skipped with reason)
