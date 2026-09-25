---
name: stir-decoupled-frontend
description: Implement, review, debug, migrate, or optimize Stir's Nuxt 4 frontend, Nuxt UI 4 theme layer, Nitro server, and Lupus Drupal Custom Elements integration. Use for Vue components, composables, Drupal payloads, SSR/hydration, routing, API proxies, authentication, Webforms, media, runtime configuration, caching, performance, tests, downstream overrides, or changes spanning Drupal and Nuxt.
---

# Stir Decoupled Frontend

Preserve a reusable Nuxt layer, a thin project base, and explicit Drupal-to-Nuxt contracts. Treat SSR output and production behavior as acceptance surfaces.

## Establish ownership

1. Read every applicable `AGENTS.md` and the Drupal, SEO, or accessibility skills triggered by the work.
2. Identify the source-of-truth checkout and downstream copies before editing.
3. Put reusable Nuxt behavior in `nuxtjs-drupal-stir`, generic CE behavior in `nuxtjs-drupal-ce`, portable project assembly in `stir-nuxt`, Drupal producer behavior in `stir-tools`, and client-specific content/brand decisions in the client app.
4. Search existing Nuxt UI components, layer components, composables, server utilities, and CE helpers before adding abstractions.
5. Read [current-sources.md](references/current-sources.md) for version-sensitive official guidance and verify live sources for dependency decisions. For inline editing, rich-text schemas, or collaboration, also read [editorial-stack.md](references/editorial-stack.md).

## Build client projects the fleet way

These rules apply in a client app cloned from the Stir Nuxt starter, not in the layer or the starters.

- Before building anything, read these skills and look at how sibling client projects solved the same problem. Build it the same way; a project must not invent its own pattern.
- Style in this order and stop at the first that works: `app.config` (Nuxt UI theme and existing `stirTheme` keys), a component's `ui`, CSS, and only then a layer component override. Do not override layer components or add `stirTheme` keys unless nothing earlier can do it. In CSS, use `@apply` partials only where inline Tailwind cannot reach.
- Project Paragraph components use inline Tailwind classes. Style a one-off Nuxt UI instance with `:ui`, not `tv()`.
- Propose a capability the layer lacks upstream. A proof of concept may live in the project only until it is proven worth promoting, and must be flagged as a POC.
- The designer's mocks are the design. Improve only responsiveness and accessibility, such as nudging a colour just enough to pass contrast. Keep their colours, compositions and copy, and never invent copy.

## Preserve the contract

- Treat Drupal payload shapes, component names, fields, links, cacheability, access, redirects, and errors as versioned contracts.
- Prefer `nuxtjs-drupal-ce` helpers and the internal `/api/*` proxy over ad hoc Drupal fetches.
- Keep API keys and secrets server-only. Forward only required headers and cookies; never serialize private runtime config into payloads or `useState`.
- Preserve Drupal status and access semantics. Do not turn upstream 401, 403, 404, validation, or redirect behavior into generic 200 responses.
- Keep public origins deterministic across canonical URLs, sitemaps, redirects, media and metadata.
- Document producer and consumer changes together. Maintain compatibility or introduce an explicit migration/version boundary.
- Treat a layer component's props, emits and slots as consumer API too. A site component with the same resolved name replaces the layer's silently, so before changing them run `pnpm audit:overrides <site>` on each consumer; an override must match the layer's emit types or the site fails typecheck at deploy.
- Type form events with Nuxt UI's own `FormSubmitEvent` and `FormErrorEvent`, and expose payload types through a public alias such as `#stir-auth/types`, so an override can name them instead of restating their shape.

## Build for SSR

- Use `useFetch`, `useAsyncData`, or established CE composables for render data so server results hydrate without duplicate requests.
- Keep server and client output deterministic. Do not ignore hydration warnings.
- Guard browser-only APIs with Nuxt-safe client boundaries; avoid broad `ClientOnly` when SSR content matters.
- Never place request-specific mutable refs at module scope. Use SSR-safe state with stable explicit keys.
- Use typed, serializable runtime configuration. Put only intentionally public values under `runtimeConfig.public`.
- Prefer semantic Nuxt UI components, theme tokens, variants, and Tailwind utilities before custom wrappers or CSS.
- Style CMS content only through presentation choices: Surface and Variant entries and the `richText` list in `stirTheme.presentation`, never free-text classes, safelists or CMS-only `@source inline`. Read [presentation-choices.md](references/presentation-choices.md) before adding a style editors can pick, or before migrating a site off `field_classes`.
- Prefer Nuxt Scripts and its registry, triggers, consent, lifecycle and loading-state APIs for third-party scripts. Keep a component-scoped loader only when a verified vendor contract requires DOM placement Nuxt Scripts cannot express; preserve origin allowlisting, cleanup, error state and regression coverage.
- Declare every package imported by a published layer as its own direct dependency or peer dependency; do not rely on a consumer or another package exposing a transitive install.
- Preserve accessible native semantics when mapping Drupal custom elements. Unknown elements must fail visibly and diagnostically, not silently disappear.

## Design data, cache and security

- Deduplicate SSR requests and avoid client refetch during hydration.
- Define cache ownership and invalidation across Drupal, Nitro, reverse proxy and CDN before caching a route.
- Vary authenticated or personalized responses correctly and prevent private data entering shared caches.
- Validate mutation input server-side, enforce same-origin/CSRF protections as applicable, bound bodies and uploads, normalize upstream errors, and set explicit timeouts.
- Do not expose raw upstream errors, tokens, internal hosts or stack traces.
- Avoid speculative performance work. Measure production builds and representative Drupal payloads.
- Every composable pulled into the initial graph is paid for by every visitor. Prefer ones already in the graph, and check `pnpm perf:report` before adding another: VueUse's `useStorage` alone added ~5 kB gzip to replace two small helpers.
- Optimize LCP media, font delivery, hydration and bundle cost without degrading content semantics or interaction readiness.

## Verify proportionately

1. Run focused unit/component tests for changed logic.
2. Run Nuxt runtime tests for auto-imports, layers, plugins, composables, SSR and hydration behavior.
3. Run contract tests when payloads, CE mappings, endpoints, auth, redirects, metadata or Webforms change.
4. Run lint, typecheck and a production build; use `pnpm verify:ci` as the default production-impacting gate because it includes the core and downstream-consumer jobs. Do not skip the build for server or layer-boundary changes: vitest and `vue-tsc` can pass while Nitro cannot load the code, for example when a consumer imports a layer's TypeScript server util without its `.ts` extension.
5. Smoke-test homepage, one inner CE route, menus, errors, and any affected mutation/auth path. To see a page, build and serve the output (`node .output/server/index.mjs`): the in-app browser cannot render a `nuxt dev` server, because it blocks Vite's `/_nuxt/@fs/` asset URLs. If the build fails on `realpath '@img/sharp-…'`, `node_modules/@img` holds dangling platform links; run `rm -rf node_modules/@img && pnpm install`.
6. Inspect initial HTML, Nuxt payload, response status/headers and browser console. Verify no hydration mismatch or duplicated request.
7. Run accessibility checks for UI changes and manual keyboard/focus checks where interaction changes.
8. For performance claims, compare at least three mobile production runs and report medians for LCP, INP or TBT as available, CLS, transfer and relevant request counts.

## Finish pull requests against CI

1. Merge or rebase the target branch before final verification and resolve conflicts intentionally.
2. Regenerate tracked inventories and generated contracts, then run their check modes. Never hand-edit generated inventories.
3. For shared components, test blank or malformed CMS values, accessible names, runtime rendering, SSR or hydration as applicable, and downstream consumer typecheck/build behavior.
4. Derive responsive media behavior from the configuration used by the active layout, not stale settings from an inactive rendering branch.
5. Push, confirm GitHub reports the PR mergeable, and watch required checks to completion. Local green tests alone are not completion.
6. Convert review findings into regression coverage when they describe behavior, compatibility, accessibility, SSR, hydration, or consumer risk.
7. To move a consumer onto a new layer release, use `pnpm update @stir/base --latest`: plain `pnpm update` keeps the cached GitHub resolution. Confirm the lockfile's tarball commit changed before verifying.
8. When dependencies update, re-check each pnpm override, patch and compatibility shim against the new versions and remove what the release fixed; record why each one that stays is still needed.
9. Keep third-party scripts out of the initial bundle: load them with a dynamic `import()` once consent and configuration allow, and remove a module's client plugin through the `app:resolve` hook rather than patching it when it would import them eagerly.

## Report clearly

State user-visible behavior, owning layer, Drupal contract impact, SSR/hydration impact, cache/invalidation impact, security/privacy impact, accessibility impact, environment changes, checks run, and residual risk. Do not claim downstream compatibility from a layer-only test.
