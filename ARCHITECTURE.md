# Architecture Map: nuxtjs-drupal-stir ↔ stir-tools

Shared reference for how the Nuxt 4 frontend (`nuxtjs-drupal-stir`) and the Drupal 11
backend (`stir-tools`) fit together. This is a documentation pass only — no
recommendations, no changes.

Two repos:

- **nuxtjs-drupal-stir** — Nuxt 4 layer/theme system. Layers live under `layers/*`,
  each an independent Nuxt layer that can be composed into a downstream project.
- **stir-tools** — Drupal 11 backend. Custom functionality lives in `modules/stir_*`.

They talk to each other via **Lupus Decoupled Custom Elements**
(`drupal/custom_elements`, wired into Nuxt via the `nuxtjs-drupal-ce` module) plus a
set of bespoke `stir_*` REST/JSON endpoints for everything CE doesn't cover
(auth, webforms, listings, SEO, sitemap).

---

## 1. Cross-repo contract layer

This is the connective tissue and the most load-bearing part of the coupling, so it's
covered first.

**Where contracts live:**

- Drupal side (source of truth): `stir-tools/contracts/v1/` — schemas + fixtures,
  versioned by semantic-compatible major (`additiveChanges: same-major`,
  `breakingChanges: new-major`). `contracts/README.md` states
  `consumerReleaseLockstep: false` — the two repos are independently releasable as
  long as the contract major is compatible. A `manifest.json` maps each contract to
  the Drupal module that owns it (e.g. `webform.submission` → `stir_webform_rest`,
  `component.tree` → `stir_layout_builder`/`stir_layout_paragraphs`,
  `seo.sitemap` → `stir_sitemap`). `composer test:unit` validates producer payload
  builders against these schemas on the Drupal side.
- Nuxt side (mirror, not authored here): `nuxtjs-drupal-stir/contracts/stir-tools/`.
  Per its README, this is "a generated build/test snapshot whose source of truth is
  Stir Tools `contracts/v1`," refreshed manually via
  `pnpm contracts:sync /path/to/stir-tools/contracts/v1`, which writes per-file
  SHA-256 checksums into `snapshot.json`. It is explicitly **not** a runtime
  dependency — only used in unit tests to validate fixtures against schemas. At
  inspection time both repos were at `contractVersion: 1.24.0` and in sync.
- **Drift risk:** because sync is manual/CI-triggered rather than automatic, the
  Nuxt snapshot can silently lag the Drupal producer contract between syncs.
  Checksums only catch drift during test runs, not at runtime — a live mismatch
  would surface as a parse/validation failure in the Nuxt server, not a build error.

**Contracts covered:** auth session/account, webform + submission response,
component tree, app-context, media (image/video/summary), SEO global meta, sitemap,
listing response. These are REST/JSON *response shapes*, not raw JSON:API resource
shapes.

**`nuxtjs-drupal-ce` config (Nuxt side, set in `layers/platform/nuxt.config.ts`):**

- `drupalBaseUrl` / `menuBaseUrl`: both derived from `DRUPAL_URL`.
- `exposeAPIRouteRules: true`, `disableFormHandler: true` (webform submission is
  handled by the custom `webform` layer instead), `enableComponentPreview: false`,
  `customErrorPages: true`.
- `customElementJsonFormat` is **not** overridden on the Nuxt side — it silently
  relies on Drupal's default.

**Custom Elements config (Drupal side):** package is `drupal/custom_elements`
(`^3.4.1`), not literally named "Lupus" in this codebase. Default install config
(`custom_elements.settings.yml`): `markup_style: web_component`,
`json_format: explicit` — the format Nuxt implicitly depends on. Per-paragraph-type
CE display config lives under each `stir_layout_builder_paragraph_*` submodule
(~20 paragraph bundles: hero, text, accordion, webform, carousel, timeline, etc.).

**`core` layer's proxy override:** `layers/core` intentionally replaces
`nuxtjs-drupal-ce`'s own Nitro proxy handlers for `/api/drupal-ce/**` and
`/api/menu/**` — filtered out in `layers/core/nuxt.config.ts` by matching the
resolved handler file path — because the upstream module doesn't expose the H3
cookie-filter hooks needed for secure cookie forwarding. Per its README, this
preserves the *public* `/api/drupal-ce` and `/api/menu` contracts unchanged; only
the internal proxy implementation is swapped.

**API key enforcement:** Drupal-side, in
`stir-tools/modules/stir_layout_builder/src/EventSubscriber/ApiAuthSubscriber.php`
— a kernel event subscriber gating `/ce-api`, `/*/ce-api/*`, and the
`presentation-manifest` route, with an explicit public carve-out for menu endpoints
(`/ce-api/api/menu_items/*`, no key required). Validates `X-API-Key` via
`hash_equals()` against `drupal_api_key` (settings or `$_SERVER['DRUPAL_API_KEY']`);
anonymous/invalid requests get a 403 JSON envelope. Nuxt side:
`layers/foundation/server/utils/stirDrupalApi.ts` sets `x-api-key` on outgoing
requests; `layers/core/server/utils/drupalCeProxy.ts` explicitly strips any
client-supplied `x-api-key` before re-setting the server-held key, preventing key
spoofing through the proxy.

**Other tight-coupling points:**

- **CE machine-name ↔ Vue filename mapping:** every Drupal paragraph-bundle CE
  display config must have a matching kebab-case Vue component filename (per
  `AGENTS.md`'s 1:1 mapping rule). Renaming a bundle on Drupal breaks rendering
  unless the Nuxt component is renamed in lockstep.
- **Menu endpoint path:** the public-menu carve-out
  (`/ce-api/api/menu_items/*`) is hardcoded identically on both sides
  (`ApiAuthSubscriber.php` and Nuxt's `layers/core/server/api/menu/[...].ts` /
  `drupalCeProxy.ts` default template `api/menu_items/$$$NAME$$$`).
- **Webform field-name pass-through:** `layers/webform` deliberately does *not*
  snake/camel-case-convert field names — they're sent to Drupal exactly as
  authored, with alias remapping in `webformFieldUtils.ts`. This avoids one class
  of drift but means a Drupal-side field rename breaks submissions with no
  translation layer.

---

## 2. Nuxt layer map

### `foundation`

Lowest-level, CE-agnostic base layer. Sets up Nuxt UI, Tailwind, `nuxt-vitalizer`,
and shared runtime config. Its core deliverable is
`server/utils/stirDrupalApi.ts` — the single shared primitive every other layer
uses to talk to Drupal: origin enforcement, cookie/CSRF forwarding, Set-Cookie
filtering/splitting, private-cache marking, normalized upstream error handling.
Also ships generic SSR/cache-safety middleware (private-cache no-store for
Drupal-session requests, one-time-login redirect passthrough).

- **Consumes:** Drupal's generic session/CSRF endpoint (`/session/token`) and
  one-time-login URL convention — Drupal-core conventions, not stir-tools-specific.
- **Custom vs. stock:** entirely custom security/proxy toolkit. Nuxt UI/Tailwind/
  vitalizer wiring is stock with light overrides.
- **Coupling:** low and generic (Drupal-core session cookie patterns), but other
  layers implicitly depend on config shapes this layer doesn't itself define
  (e.g. `drupalCe.serverDrupalBaseUrl`, configured in `platform`).

### `platform`

Composes `foundation` + `core` + `theme` and is the layer that actually installs
`nuxtjs-drupal-ce`. Adds site-metadata defaults, icon bundling for Drupal-authored
contact data, theme path aliases, Vite build tweaks. Per its README, narrow
capability layers (auth, Turnstile) extend `foundation` directly rather than
`platform` — only `webform` still depends on `platform` pending extraction.

- **Consumes:** configures `nuxtjs-drupal-ce` directly (see §1); doesn't parse
  payloads itself.
- **Custom vs. stock:** mostly stock module usage with explicit overrides
  (`disableFormHandler`, `enableComponentPreview: false`); site-block config and
  icon collections are project glue.
- **Coupling:** low/indirect — enables CE integration that `core` then overrides.

### `core`

Replaces `nuxtjs-drupal-ce`'s server-side proxy handlers (see §1) and adds a
first-party `/api/app-context` endpoint with strict schema validation (falls back
to an empty shell on failure rather than throwing).

- **Consumes:** `/api/app-context` (site blocks, footer menu, site info — matches
  `component-tree`/`app-context` schemas field-for-field); CE proxy to
  `{drupalBaseUrl}{ceApiEndpoint}` (default `/ce-api`); menu proxy to
  `api/menu_items/$$$NAME$$$` with a 5-minute shared cache unless a session cookie
  is present.
- **Custom vs. stock:** the proxy *replacement* is a deliberate override (see §1);
  app-context endpoint and validators are net-new.
- **Coupling:** high and explicit — hardcoded `/ce-api` default, hardcoded menu
  endpoint template, app-context response shape coupled field-for-field to the
  stir-tools schema. Most contract-sensitive of the base layers; validators are
  meant to be checked in CI against `contracts:sync`.

### `theme`

The largest layer — the Nuxt UI 4 + Tailwind 4 application shell: layouts, the
catch-all Drupal page route (`app/pages/[...slug].vue`), the full component
library for rendering Drupal custom elements/paragraphs, navigation, media, motion,
image/CDN delivery, and a build-time "presentation manifest" pipeline that
generates Tailwind utility CSS from a Drupal-declared usage manifest.

- **Consumes:** wraps `nuxtjs-drupal-ce`'s `useDrupalCe()` with a typed
  `StirDrupalPage` shape (`content.element/props/slots`, `metatags`,
  `is_front_page`, `local_tasks`, `related.prevNode/nextNode`); proxies Drupal
  Views refreshes to a hardcoded `stir-layout-builder/paragraph/{id}/view` path;
  fetches and validates a `schemaVersion: 2` presentation-manifest at build time
  from `stir-layout-builder/presentation-manifest`; directly imports SEO-layer
  utilities for global meta injection.
- **Custom vs. stock:** `useDrupalCe()`/`resolveCustomElement`/render helpers are
  stock `nuxtjs-drupal-ce`; everything wrapping them (typed page composable,
  manifest-driven CSS generation, custom IPX image provider) is custom.
- **Coupling:** high — hardcoded `stir-layout-builder` paths; the presentation
  manifest's `schemaVersion: 2` vocabulary (grid/spacing/width/alignment,
  `legacyClasses`) would break silently on schema drift; core field names
  (`content.element/props/slots`, `is_front_page`, `local_tasks`) are assumed
  Drupal CE response shape, not independently contract-versioned the way SEO/
  listing are.

### `seo`

Optional capability layer. Owns `/api/seo/global` and `/api/sitemap` server
boundaries plus a client plugin injecting Drupal-sourced global meta tags into
`useHead()` on non-Drupal routes. Wires `@nuxtjs/sitemap` / `@nuxtjs/robots`.

- **Consumes:** `/api/seo/global` (matches `global-seo.schema.json`, falls back to
  empty on failure rather than throwing); `/api/sitemap` (matches
  `sitemap.schema.json`); rewrites `/sites/default/files/` Drupal-relative asset
  URLs; recognizes only `og:image`/`twitter:image`/`image_src` for social-image
  optimization.
- **Custom vs. stock:** `@nuxtjs/sitemap`/`@nuxtjs/robots` are stock; dedup logic,
  the global-SEO injection plugin, and social-image optimization are custom.
- **Coupling:** hardcoded `/api/seo/global`, `/api/sitemap`, and
  `/sites/default/files/` paths; default `drupalRouteNames: ['slug']` assumes the
  catch-all page route is literally named `slug`; a stir_seo rename of
  `og:image`/`twitter:image` keys breaks image optimization silently.

### `listing`

Small optional layer providing `/api/listings/:listing` for typed, bounded
editor-configured listings — distinct from ad-hoc embedded Drupal Views (which stay
on `theme`'s View rendering path).

- **Consumes:** Drupal's `stir_listing` REST endpoint at
  `/api/stir/listings/${listing}` (called directly, not through the CE proxy),
  validated with a strict schema (`additionalProperties: false`) matching
  `listing-response.schema.json` exactly — `items`, `pager`, `filters`, `sort`,
  `meta{provider,summaryEntityType,summaryViewMode,personalized}`.
- **Custom vs. stock:** entirely custom — no stock module involved.
- **Coupling:** high — strict schema means any new/renamed field from
  `stir_listing` throws and 502s the endpoint. Privacy guard: response is marked
  private/no-cache if a request cookie was present, Drupal set a session cookie,
  or `meta.personalized` is true. No direct reference to `stir_entityqueue` found
  in this layer — if entityqueue drives ordering, that's Drupal-side only.

### `auth`

Owns `/auth/*` and `/account/*` pages and a server proxy under `/api/auth/*` /
`/api/account/*`. Also implements a fully local, Drupal-independent "protected
page" password gate (separate concern, no Drupal involvement).

- **Consumes:** proxies 1:1 onto `stir_account` routes — login, logout, session,
  register, config, register-policy, verify, password request/reset/validate,
  account settings/email/password/cancel. Contracts versioned/mirrored in both
  repos (`auth-*`, `account-*` schemas); `/api/auth/config` validated against a
  strict `version: literal(2)` schema. `stir_login_switch` contributes only an
  admin form/redirect controller — not consumed as an API.
- **Custom vs. stock:** entirely custom Nitro routes/composables on top of
  `foundation`'s shared request primitives; no `nuxtjs-drupal-ce` auth helpers
  exist.
- **Coupling:** hardcoded Drupal path strings throughout; `session.get.ts` assumes
  a specific response shape that would break silently on a Drupal field rename;
  the `version: literal(2)` auth-config schema hard-fails on an uncoordinated
  Drupal contract bump.

### `webform`

Renders Drupal Webform definitions (fields, validation, conditional visibility)
and owns `POST /api/webform/submit`, including multipart/file uploads.

- **Consumes:** `stir_webform_rest`'s REST resource at
  `/api/stir_webform_rest/submit`, which requires `webform_id` and
  `turnstile_response` — both hardcoded client-side too. Contracts mirrored in
  both repos.
- **Custom vs. stock:** fully custom body parsing, validation-schema builder, and
  field components; composes Nuxt UI inputs but isn't built from a stock form
  module. Uses `core`'s shared CSRF/cookie helpers.
- **Coupling:** hard requirement that every submission include
  `turnstile_response` — if Drupal ever made Turnstile optional per-form, Nuxt
  would still block submission. Field-name pass-through is a deliberate
  anti-coupling design choice (see §1).

### `turnstile`

Thin wrapper providing the `TurnstileField` component and Cloudflare site-key/
secret config. Doesn't talk to Drupal directly — only produces a token that
`auth` and `webform` forward.

- **Consumes:** no direct HTTP contract. `stir_tools/modules/stir_turnstile`
  (`TurnstileValidator`) is a server-side validation *service* consumed
  internally by `stir_account`/`stir_webform_rest` — it has no routing.yml of its
  own. Coupling is indirect: both sides must agree on the Cloudflare key pair and
  the `turnstile_response` field name.
- **Custom vs. stock:** stock `@nuxtjs/turnstile` module for the widget; custom
  wrapper for theming/error UI.
- **Coupling:** low and indirect; no shared schema file.

### `analytics`

Registers Plausible Analytics with consent-gated initialization, bridging
`usePrivacyConsent` (from `integrations`) to defer/enable tracking.

- **Consumes:** nothing from stir-tools. Talks directly to Plausible's own hosted
  API. **Note:** `stir_tools/modules/stir_analytics` exists but is purely
  Drupal-admin dashboard tooling (stats viewer inside Drupal) — same product name,
  functionally unrelated to this layer. Worth knowing so the naming overlap
  doesn't get assumed to mean integration.
- **Custom vs. stock:** module registration is mostly stock `@nuxtjs/plausible`;
  the consent-deferral bridge is fully custom.
- **Coupling:** none to stir-tools.

### `integrations`

Owns the optional popup/privacy-notice UI and site-wide consent policy consumed by
`analytics` and third-party scripts.

- **Consumes:** not a direct REST client — reads popup config
  (`paragraph-popup` element, `visibility.requestPath` rules) out of the
  already-fetched Drupal CE page/app-context payload, i.e. depends on
  `nuxtjs-drupal-ce`'s page-fetch contract and Layout Paragraphs' element/prop
  naming rather than a dedicated `stir_*` module.
- **Custom vs. stock:** fully custom traversal/visibility logic on top of the CE
  page shape.
- **Coupling:** hardcoded `'paragraph-popup'` element name and dual snake/camel
  prop fallbacks; a rename of that element type would silently stop popups
  rendering, with no schema validation to catch it (unlike auth/webform).

### `editorial`

Editor-only UI: local-task tabs, inline rich-text editing, paragraph
presentation/layout editing, drag/drop layout arrangement — plus the authenticated
proxy routes backing these mutations.

- **Consumes:** Drupal CE endpoints under the `stir-layout-builder` CE namespace
  (`/api/drupal-ce{ceApiEndpoint}/stir-layout-builder/paragraph/{id}/text` and
  `.../presentation`) — not a standalone `stir_*` REST module, and not present in
  the `contracts/stir-tools` snapshot.
- **Custom vs. stock:** entirely custom server proxy code plus a custom
  TipTap-based editor preserving Drupal-specific HTML blocks
  (`<drupal-media>`, `<stir-cta>`).
- **Coupling:** hardcoded `stir-layout-builder` path segment; a 409 status is
  special-cased as a stale-revision conflict — Drupal's optimistic-locking error
  semantics are load-bearing here with no formal schema documenting them.

### `diagnostics`

Repository-only Vite build-analysis tooling (bundle stats for a performance-audit
workflow). No server routes, no Drupal-facing code. Excluded from minimal/full
consumer presets.

- **Coupling:** none.

---

## 3. Summary: where the repos are tightly coupled

These are the points where a change on one side requires a coordinated change on
the other, ranked roughly by blast radius:

1. **CE machine-name ↔ Vue component filename** (1:1 kebab-case mapping) — a
   Drupal paragraph bundle rename breaks rendering unless mirrored in Nuxt.
2. **`customElementJsonFormat`** — Nuxt relies on Drupal's `explicit` default with
   no explicit override; a Drupal-side change would break every CE response
   silently.
3. **Contract snapshot drift** — `contracts:sync` is manual; the two repos can be
   out of sync between runs with no runtime detection, only test-time checksum
   checks.
4. **`app-context` and `component-tree` shapes** (`core` layer) — strict
   validation, fails safe (empty shell) rather than partially rendering.
5. **Presentation manifest `schemaVersion: 2`** (`theme` layer, build-time) —
   grid/spacing/width/alignment vocabulary and `legacyClasses` are a strict
   contract; a mismatch throws at build time.
6. **Listing response schema** (`listing` layer) — `additionalProperties: false`;
   any Drupal-side field addition/rename 502s the endpoint at runtime.
7. **Auth config contract version** (`auth` layer) — `version: literal(2)` hard
   fails on an uncoordinated Drupal bump.
8. **Webform `turnstile_response` + `webform_id` requirements** — hardcoded on
   both sides outside the versioned schema.
9. **`stir-layout-builder` CE namespace paths** — used directly (not via a
   generic contract) by `theme` (Views refresh, presentation manifest) and
   `editorial` (paragraph text/presentation editing).
10. **Menu endpoint template and public-key carve-out** — identical hardcoded
    path pattern on both sides (`api/menu_items/$$$NAME$$$` /
    `/ce-api/api/menu_items/*`).
11. **`paragraph-popup` element/prop naming** (`integrations` layer) — no schema
    validation; a rename would fail silently.

---

## Open questions for you

A few things the research surfaced that I couldn't fully resolve from code alone —
flagging rather than guessing:

- **`listing` ↔ `stir_entityqueue`**: no direct reference to `stir_entityqueue`
  was found in the `listing` layer. If entityqueue drives item ordering for some
  listings, is that entirely Drupal-side (i.e. `stir_listing` reads from
  entityqueue internally and Nuxt never sees the distinction), or is there a
  separate integration path I haven't found?
- **`editorial` layer contracts**: the `stir-layout-builder` paragraph text/
  presentation endpoints it depends on aren't in the `contracts/stir-tools`
  snapshot the way auth/webform/listing/SEO are. Is that intentional (editorial
  is considered lower-risk / internal-only tooling) or a gap?
- **Contract sync cadence**: is `pnpm contracts:sync` run manually by whoever ships
  a stir-tools contract change, or is there a CI step enforcing it that I didn't
  see in this pass? Worth knowing since drift here fails silently until a schema
  validation error surfaces.
