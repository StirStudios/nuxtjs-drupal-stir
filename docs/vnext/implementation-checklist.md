# Nuxt vNext implementation checklist

This checklist turns `docs/vnext-architecture-review.md` into reviewable delivery slices. The current production line remains `dev`; this branch begins at `f5912d9fad118f8fc5d4439a73270c3010fed9d7`.

## Baseline to preserve

- Latest verified `dev` CI: quality, consumer typecheck, and consumer build are green.
- Full-preset initial client: 191.27 kB gzip.
- Preserve the recent Drupal View query/state, media modal, deferred-video, Nuxt UI prop, and CI type refinements.
- Preserve SSR, Drupal CE rendering/overrides, proxy and cookie security, Webforms, auth, accessibility, and downstream configuration compatibility until an explicit adapter replaces it.

## Current checkpoint status

- N0 inventory generation is implemented by `pnpm audit:vnext-inventory`.
- The checked artifact is `docs/vnext/current-inventory.json` and intentionally excludes machine-specific paths.
- Current measured surface: 99 components, 60 composables, 38 utilities, 5 plugins, 4 middleware files, 26 server routes, 25 production dependencies, 24 development dependencies, and 83 test files.
- N0 now fails on fatal Nuxt setup/hydration diagnostics, exercises a deterministic mocked-Drupal homepage twice under SSR, hydrates that homepage in Chromium CI, and validates packed minimal/full consumers in CI.
- N1 has started with a checksum-protected Stir Tools v1 snapshot, schema validation, aligned registration/Webform types, administrator-approval handling, and safe Drupal Webform confirmation redirects. The synchronized compatibility manifest validates Drupal/PHP requirements, optional provider-capability ownership, and independent Nuxt/Stir Tools releases. Registration policy and versioned auth UI configuration now validate before routing/composables; app-context normalizes Drupal's empty-array compatibility shapes and recursively validates its component trees; global SEO and the runtime-fresh sitemap validate before reaching their Nuxt consumers. The shared source-independent tree contract covers direct rendered fields, media, entity references, and nested components.
- N2 has started with a shared `layers/platform` boundary plus explicit `presets/minimal` and `presets/full` consumers. The minimal preset excludes the auth layer; the full preset preserves the existing root behaviour while the remaining capabilities are extracted.
- The optional `layers/webform` boundary now owns Webform rendering, submission, limits, and Turnstile registration. The minimal preset excludes both the Webform route and Turnstile module.
- Optional `layers/analytics` and `layers/scripts` boundaries now own Plausible and Nuxt Scripts/UserWay respectively; neither is loaded by the minimal preset.
- Validation now uses one Valibot/Nuxt UI Standard Schema foundation across auth, account, dynamic Drupal Webforms, and server contract parsing; Yup is no longer a direct dependency or layer import.
- N4 has started with all theme consumers routed through a Stir-owned Drupal CE facade. It delegates the upstream API while development builds surface unresolved components, unknown field elements, and malformed component nodes instead of silently dropping them; production retains the direct upstream rendering path.
- N5 has started with a validated build-time presentation-usage manifest and compatibility reserve, plus a public typed listing composable and Nuxt server boundary that validate the producer-owned response, preserve safe Drupal sessions, and forward public cache metadata without downstream proxy overrides.

## Delivery slices

### N0 — Freeze the executable baseline

- Generate inventories for supported imports/components/config, routes, middleware, plugins, dependencies, downstream overrides, and feature registration.
- Record minimal/full build, payload, performance, accessibility, and packed-consumer baselines.
- Make test initialization errors fail visibly; add deterministic homepage SSR/hydration coverage and CI coverage for the packed consumer.
- Runtime behavior must not change.

Acceptance: `pnpm verify:ci` passes; generated inventories are deterministic; current consumers still typecheck/build; baseline artifacts are documented.

Rollback: documentation/development tooling can be removed without touching runtime code.

### N1 — Consume the producer-owned Drupal contract

- Accept a versioned schema/fixture artifact from Stir Tools at build/test time.
- Validate or generate boundary types from the artifact.
- Parse real sanitized fixtures through production readers, including errors and nullable/optional fields.
- Add a compatibility manifest without forcing unrelated Nuxt/Stir releases into lockstep.

Acceptance: CI proves one declared backend/frontend combination; drift in Webform/auth/page/listing contracts fails before release; production payload behavior remains compatible.

Paired work: Stir Tools D1.

### N2 — Establish capability boundaries

- Create the workspace/package boundaries described in the architecture review without changing the compatibility preset.
- Register optional auth, Webform, editor, integrations, and diagnostics only when selected.
- Keep public exports intentional and move implementation helpers out of auto-import/auto-component surfaces.

Acceptance: minimal and full fixtures pass; full preset produces equivalent routes, HTML, payload handling, and public compatibility; minimal preset demonstrates measured dependency/plugin/route reductions.

### N3 — Port pure shared policy

- Move normalization, schema validation, routing/security policy, and contract adapters into the shared package.
- Reuse Nuxt/Nitro/Nuxt UI/VueUse primitives; do not add wrappers without owned policy.

Acceptance: pure unit tests cover policy; no browser-only APIs enter SSR paths; no duplicated compatibility parsing remains across layers.

### N4 — Build the Stir Drupal facade and standard renderer

- Isolate Lupus/`nuxtjs-drupal-ce` integration behind the Stir adapter.
- Add explicit missing-component/unknown-field diagnostics.
- Render supported ordinary Drupal field families generically from the field contract.
- Render the source-independent component tree, including nested named layout slots.

Acceptance: direct fields and Layout Paragraphs fixtures render without project adapters; downstream element overrides remain deterministic; SSR/hydration and cache/security behavior pass.

Paired work: Stir Tools D2–D4.

### N5 — Listings and presentation usage

- Consume the common embedded-View and lightweight-listing response contracts.
- Generate Tailwind 4 sources from the validated Drupal presentation-usage manifest while retaining a compatibility reserve.
- Record the manifest hash used by each production build.

Acceptance: representative listings meet payload/latency/cache budgets; missing utilities are detected; compiled CSS is smaller without visual regressions.

Paired work: Stir Tools D5–D6.

### N6 — Compatibility preset and consumer pilot

- Complete compatibility adapters with deprecation notes and measurable removal conditions.
- Test minimal, full, auth, Webform, editor, override-heavy, packed, RSF, and DancePlug fixtures.
- Pilot the least customized consumer with a documented cutover and rollback.

Acceptance: current behavior is preserved where promised; minimal/full budgets pass; the pilot succeeds before another consumer migrates.

## Explicit non-goals

- Do not replace Lupus or `nuxtjs-drupal-ce` without measured evidence and a separate decision.
- Do not absorb RSF/DancePlug business rules into the base.
- Do not make Canvas part of the critical path.
- Do not redesign branding while restructuring the platform.
- Do not optimize by deleting compatibility before consumer evidence proves it unused.

## Verification for every runtime slice

Follow `AGENTS.md`. Production-impacting changes run `pnpm verify:ci`; auth/proxy/routing changes also run the required security smoke checklist. Performance claims require production builds and representative Drupal payloads. Each handoff reports skipped checks, public/config changes, Drupal impact, risks, and rollback.
