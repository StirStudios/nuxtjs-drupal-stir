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
- `pnpm verify:ci` now fails when that inventory is stale. Its API-surface
  section distinguishes the small intentional stable surface from the larger
  auto-scanned compatibility surface and records candidate deprecations without
  removing them ahead of consumer evidence.
- Current measured repository surface: 110 components, 62 composables, 40 utilities, 6 plugins, 4 middleware files, 26 server routes, 25 production dependencies, 24 development dependencies, and 98 test files. Optional preset audits separately prove which of these are registered and shipped.
- N0 now fails on fatal Nuxt setup/hydration diagnostics, exercises a deterministic mocked-Drupal homepage twice under SSR, hydrates that homepage in Chromium CI, and validates packed minimal/full consumers in CI.
- The blocking accessibility gate now scans a deterministic mocked-Drupal page
  in desktop/mobile and light/dark modes against WCAG 2 A/AA, WCAG 2.1/2.2 AA,
  and axe best-practice rules; it never inherits a developer's project URL.
- N1 has started with a checksum-protected Stir Tools v1 snapshot, schema validation, aligned registration/Webform types, administrator-approval handling, and safe Drupal Webform confirmation redirects. The synchronized compatibility manifest validates Drupal/PHP requirements, optional provider-capability ownership, and independent Nuxt/Stir Tools releases. Registration policy and versioned auth UI configuration now validate before routing/composables; app-context normalizes Drupal's empty-array compatibility shapes and recursively validates its component trees; global SEO and the runtime-fresh sitemap validate before reaching their Nuxt consumers. The shared source-independent tree contract covers direct rendered fields, media, entity references, and nested components.
- N2 has started with a shared `layers/platform` boundary plus explicit `presets/minimal` and `presets/full` consumers. The minimal preset excludes the auth layer; the full preset preserves the existing root behaviour while the remaining capabilities are extracted.
- `layers/foundation` now owns shared Nuxt UI, validation, baseline CSS, Drupal
  request/security policy, runtime API configuration, and session privacy.
  Auth-only consumers compose Turnstile plus this foundation and no longer load
  Drupal CE website routes, core, theme, menus, app context, or embedded Views.
  The website platform composes foundation, core, and theme; Webform remains on
  that platform until its shared field-renderer boundary is extracted.
- The optional `layers/webform` boundary now owns Webform rendering, submission, and limits. The minimal preset excludes the Webform route.
- Webform now also owns its complete dynamic field-component family. Minimal
  website consumers no longer register the 18 address, choice, date/time, file,
  numeric, text, and renderer components, while the full preset retains the
  same component names and downstream override seam.
- Webform-owned validation-schema, conditional-state, field-flattening,
  selection, payload, file, redirect, and scroll policy now lives behind an
  explicit capability alias. Its three form composables are no longer part of
  the minimal website auto-import surface; full consumers retain them.
- Turnstile registration, runtime secrets, interaction-only presentation, and the shared field now live in an independent `layers/turnstile` capability. Auth-only and Webform-only fixtures prove that both consume mandatory bot protection without loading one another; the minimal preset loads neither.
- Optional `layers/analytics` and `layers/scripts` boundaries now own Plausible and Nuxt Scripts/UserWay respectively; neither is loaded by the minimal preset.
- Plausible and UserWay app-config defaults are also owned by their optional layers. Layer contracts prove theme ownership stays clean, while the preset matrix and full runtime test prove optional registration and merged defaults.
- The optional `layers/editorial` boundary now owns real Drupal local-task tabs,
  edit actions, inline text editing UI and server routes, and admin CSS. The
  minimal preset uses shell-free theme fallbacks and neither loads nor ships
  the editorial capability; the full preset preserves the existing tools.
- The optional `layers/integrations` boundary now owns popup rendering, the
  privacy notice, their app-config defaults, and persisted consent. Analytics
  and trusted-script loading consume that policy through a Nuxt-provided
  contract. Generated preset declarations prove the minimal preset registers
  none of the three integration components, three implementation composables,
  or the consent plugin; the full preset preserves all of them.
- The optional `layers/seo` boundary now owns the sitemap module, Drupal global
  metadata plugin, Robots module, and both SEO proxy routes. Minimal, auth-only, and
  Webform-only consumers do not initialize or ship that capability; the root
  and full preset preserve existing website behavior.
- The optional `layers/listing` boundary now owns the provider-neutral listing
  route, contract types, and public composables. Minimal, auth-only, and
  Webform-only consumers no longer ship `/api/listings/:listing`; full/root
  consumers preserve the public API.
- Repository-only client-entry analysis now lives in `layers/diagnostics` and
  is selected only for explicit performance builds launched from this checkout.
  Published platform and installed preset consumers contain no report writer.
- The package allowlist ships runtime layers, presets, shared configuration,
  and the versioned Drupal contract—not repository tests, CI, audit scripts, or
  internal review documents. The current archive is 233 kB/427 files after the
  expanded producer-owned contracts and capability layers; packed-consumer CI
  enforces tight 300 kB/427-entry caps. The prior 400-entry ratchet had become
  stale before the SEO extraction (committed HEAD already packed 416 entries),
  while the byte budget remained healthy.
- Stir-owned app contracts now use explicit `#stir/utils`,
  `#stir/composables`, `#stir/components`, and `#stir/types` aliases. The
  historical `~/...` mappings remain available only as compatibility aliases
  for downstream projects and are no longer used by layer implementation code.
- Validation now uses one Valibot/Nuxt UI Standard Schema foundation across auth, account, dynamic Drupal Webforms, and server contract parsing; Yup is no longer a direct dependency or layer import.
- N4 has started with all theme consumers routed through a Stir-owned Drupal CE facade. It delegates the upstream API while development builds surface unresolved components, unknown field elements, and malformed component nodes instead of silently dropping them; production retains the direct upstream rendering path.
- The synchronized v1.15 component-tree fixture now mirrors the direct Layout
  Paragraphs producer with Drupal-declared `first`/`second` regions and a
  multi-level nested layout. Contract parsing and the real Paragraph Layout
  component runtime both prove recursive named-slot rendering without a
  project adapter.
- N5 has started with a validated build-time presentation-usage manifest and compatibility reserve, plus a public typed listing composable and Nuxt server boundary that validate the producer-owned response, preserve safe Drupal sessions, and forward public cache metadata without downstream proxy overrides.
- `pnpm perf:presentation` now builds the same minimal consumer in compatibility
  and strict-manifest modes and fails unless the validated Drupal source reduces
  both raw and compressed CSS. The current recorded fixture drops 48,844 bytes
  raw (18.54%) and 5,309 bytes gzip (15.70%) without changing application code.
- A paired production build now measures the capability split itself. The full
  compatibility preset remains effectively flat at 191.80 kB initial gzip
  against the 191.27 kB baseline (+0.28%), while the minimal preset starts at
  154.52 kB: 37.28 kB or 19.44% below full. Initial JavaScript falls from
  156.53 to 120.52 kB (23.00%), client transformation falls from 1,796 to 1,470
  modules, and generated server output falls from 10.1 MB to 5.56 MB. This is
  the intended compatibility tradeoff: existing consumers do not regress, and
  new capability-selected consumers avoid code they did not request.
- The first live DancePlug strict-manifest build now proves the project path:
  Drupal exported revision `43fcc34c` with seven used semantic values and zero
  rejected legacy utilities. DancePlug's main CSS fell from 352.08 to 305.66 kB
  raw (13.18%) and from 47.03 to 42.06 kB gzip (10.57%). The build identity is
  serialized before Nitro compilation and `/api/health` reports the exact
  manifest/source revisions, strict mode, schema, site UUID, and Drupal theme.
  DancePlug still reports Gin as its frontend theme and requires visual
  regression review plus explicit `stir_decoupled` adoption before strict mode
  becomes a project default.

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
