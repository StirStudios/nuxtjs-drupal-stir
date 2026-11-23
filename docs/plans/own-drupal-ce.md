# Plan: own the Drupal–Nuxt page contract

Status: draft for review. Nothing here has started.

## Goal

Make the page path from Drupal to Nuxt ours end to end, keep it lean, and
break nothing on the way.

- Nuxt: replace `nuxtjs-drupal-ce` with a small part of this layer.
- Drupal: switch off the Lupus Decoupled modules we don't use now. Keep
  `custom_elements`. Decide whether to replace `lupus_ce_renderer` and
  `lupus_decoupled_ce_api` only after the Nuxt side is ours.

Backward compatibility with outside users is not a goal: every consumer is one
of our sites, and each phase rolls out to all of them. Each phase still ships
on its own, so a problem points at one change.

## Why

- **Nuxt:** about 100–180 layer commits since late 2025 went into working
  around the module rather than into features. The work covered:
  - release-candidate pinning;
  - the empty-page bug that refetched the account menu on every navigation;
  - the late page layout;
  - a CI bundle-budget failure;
  - the undeclared `h3` dependency;
  - a replacement proxy.

  Our fix (upstream PR #538) has waited for a review since September. Every
  site carries the patch, the `h3` repair and an exact 2.9.0 pin. The layer
  already owns the proxy. What we still use is about 200 lines of the
  module's 900.
- **Drupal:** most sites enable form modules that we don't render, and one of
  them forces a service decorator in `stir_domain`. Stir Tools already owns
  most of the CE output through its own formatters, so `custom_elements` is a
  framework we build on, not a source of friction.

## What stays the same

- The CE JSON Drupal sends: same fields, same explicit custom-element format.
- Custom-element to component mapping: `paragraph-hero` → `ParagraphHero`,
  with the same `…Default` fallbacks.
- The `/api/drupal-ce/**` and `/api/menu/**` routes. They are already the
  layer's own.
- Redirects, 403/404 error pages, header passthrough (`x-cache-tags`,
  `x-stir-cache-until`, `set-cookie` and the others), and cache behaviour.

## Phase 0: safety net (before any change)

1. **Contract fixtures.** From each site's local Drupal, capture CE JSON for:
   - the home page, an article and a landing page with Paragraphs;
   - a Views listing with a pager;
   - a page with a webform;
   - a protected page;
   - 403, 404 and a Drupal redirect;
   - each menu.

   Strip the client names, store the fixtures under `tests/fixtures/ce/`, and
   render each one in a Nuxt runtime test. These fixtures are the contract
   both phases must keep.
2. **Navigation e2e.** Cover first load, client navigation between page
   layouts, back and forward, hash links, a redirect during navigation, an
   error page and a signed-in page. Assert that shared UI (header, account
   menu, messages) never shows the next page's data early or empty.
3. **Baselines.** Record `pnpm perf:report` and three mobile Lighthouse runs on
   one site, plus a list of every site file that uses the module. That is 22
   site files today, most of them on two sites.

## Phase 1: Drupal switch-off (Stir Tools)

Small and low-risk. It can run alongside Phase 0.

1. Uninstall these with a Stir Tools post-update, so `drush updb` does it on
   every site:
   - `lupus_decoupled_webform`, `lupus_decoupled_form` and
     `lupus_decoupled_user_form`;
   - `lupus_decoupled_layout_builder` on the sites that have it, after
     confirming nothing uses it.
2. Remove the `stir_domain` decorator of
   `lupus_decoupled_user_form.session_configuration`.
3. Check, then switch off if unused:
   - `lupus_decoupled_cors`: the browser only calls the Nuxt proxy. Check
     Stir Tools editor previews and any widget first.
   - `lupus_decoupled_schema_metatag`: compare its JSON-LD output with
     stir_seo's.
4. Review `lupus_decoupled_ce_api` settings: `preview_provider: markup` and
   `frontend_routes_redirect`.
5. Each site runs `drush updb` and `drush cex` in one commit. Verify that the
   Phase 0 fixtures are unchanged, apart from intended removals.

## Phase 2: own the Nuxt side (layer)

Ship as three releases, each rolled out to all sites before the next.

**2a. Page fetching and page state.**

The new composable fetches pages through `/api/drupal-ce` with `useFetch`. It
keeps the outgoing page until `page:finish` (the PR #538 behaviour), handles
redirects, 403/404 and messages, and passes headers through.

It also absorbs the current workarounds:
- `useStirDrupalCe`, `usePageContext` and `useResolvedPageRequest`;
- the `drupalPageLayout` plugins, with the layout resolved as part of the
  fetch;
- the one-time payload handover;
- the route snapshot.

It keeps only what we use: no legacy format, no direct-to-Drupal mode, no
`generate` branches and no i18n menu paths.

The patch, `patchedDependencies`, the `packageExtensions` `h3` repair and the
exact pin all go, from the layer and from every site.

**2b. Rendering, menus and the rest.**

- custom-element rendering (explicit format only);
- `useMenu`;
- `usePageHead`;
- messages;
- the `v-drupal-markup` directive;
- the payload-path plugin.

Site code moves to the new names in the same release: 22 files, each listed
in Phase 0.

**2c. Remove the module.**

- Drop the `nuxtjs-drupal-ce` dependency, its module config and the
  `modules:done` header hook.
- Move its runtime config to the layer's own keys.
- Rename the fleet env vars in stir-server-config's env schema and on every
  server in the same rollout:
  - `NUXT_PUBLIC_DRUPAL_CE_DRUPAL_BASE_URL`
  - `NUXT_PUBLIC_DRUPAL_CE_SERVER_DRUPAL_BASE_URL`
  - `NUXT_PUBLIC_DRUPAL_CE_MENU_BASE_URL`
  - `NUXT_PUBLIC_DRUPAL_CE_CE_API_ENDPOINT`
- The module's per-request logging also goes; until then, set
  `serverLogLevel: 'error'`.
- `nuxt-component-preview` leaves the dependency tree with the module.

**Checks for every step:**
- lint, typecheck and unit tests;
- `test:nuxt`, e2e and a11y, one at a time;
- the Phase 0 fixtures;
- `pnpm audit:consumers` against all sites;
- `perf:report` and Lighthouse compared with the baseline;
- the CLAUDE.md security smoke checklist: home page, an inner CE route, the
  menu, webform submit and the paragraph endpoints.

## Phase 3: rollout per release

1. Update the Stir site first. Deploy it, then check it through Cloudflare:
   - first load and client navigation;
   - forms;
   - the account area;
   - response headers and cache tags.
2. Update the other sites with the fleet script (lint, typecheck and tests on
   each).
3. Deploy, and check the live site the same way.

Rollback is the previous layer commit: sites pin the layer by commit in their
lockfiles.

## Phase 4: decide on the Drupal renderer (later)

Once Phase 2 is live, reconsider replacing `lupus_ce_renderer` and
`lupus_decoupled_ce_api` with a lean Stir Tools response module, about 2,000
lines.

**What it would remove:**
- the PHP 8.5 composer patch (upstream MR !70);
- the `stir_domain` base-URL decorator;
- the subscriber-priority coupling in `stir_account` and
  `stir_layout_block`;
- the example route Stir Tools deletes.

**What it would cost:** we would own access checks, 403/404 responses, cache
metadata bubbling, redirects, path aliases and preview access. Those are
security-sensitive and follow Drupal core changes.

`custom_elements` stays either way. Every Paragraph bundle's CE display config
and Stir's formatter plugins depend on it, and replacing it would mean
migrating every site's config for no gain.

## Phase 0 findings (live capture, 2026-11-23)

Captured from the public `/api/drupal-ce` and `/api/menu` endpoints of all 12
sites: 104 pages and 36 menus. The neutral fixtures in `tests/fixtures/ce/`
mirror these shapes; `tests/nuxt/runtime/CeContract.nuxt.spec.ts` checks the
page envelope and snapshots which component each element resolves to.

- Every payload uses the explicit format, with no legacy nodes. The
  legacy-format branch can go.
- 66 distinct elements appear. Site-specific ones (Views displays,
  project-specific node types) resolve through `…Default` fallbacks or site
  components, so the fallback chain is part of the contract.
- Redirect pages carry `redirect: { url, statusCode, external }` and a content
  object with no `element`.
- 404 pages render `drupal-markup` with a fallback hero. `props` arrives as `[]`
  (an empty PHP array), not `{}`.

**For Phase 1 (Drupal):**
- `#cache` render metadata leaks into the JSON on most pages.
- `local_tasks` shows the "View" and "API" (`/ce-api/node/N`) tabs to
  anonymous visitors.
- `local_tasks` is `[]` when empty and `{ primary, secondary }` otherwise.
- `site_info.mail` is sent on every page; check that this is intended.

## Open questions

- Are any site-specific uses of the module's less common functions hidden in
  the 22 site files? This is answered in Phase 0.
- Do Stir Tools editor previews need `lupus_decoupled_cors`?
- Does `lupus_decoupled_schema_metatag` output anything stir_seo doesn't?
