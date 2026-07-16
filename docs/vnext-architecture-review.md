# Stir decoupled platform: vNext architecture review

Nuxt layer reviewed branch/commit: `dev` refreshed at `f5912d9fad118f8fc5d4439a73270c3010fed9d7` (original full-review baseline `a8bb7aab1c1849c3710df37191278855692c0e0e`)  
Stir Tools reviewed branch/commit: `dev` at `395686036c01ced16dec74d3febdae05e9e90985`  
RSF consumer snapshots: Drupal `dev` at `b5f66e2605c3d3f574a4f6c3905dfb2e01ed2a15`; Nuxt `dev` at `e9ba93af8bf2c745eb59b4ed5a883fa37f25902a`  
DancePlug consumer snapshots: Drupal `dev` at `a0120c29d8bd9d06cf97b562cff7d13bc83eb613`; Nuxt `dev` at `12f444025a9de8561453144496b61fc335353f34`  
Review date: 2026-07-14; Nuxt delta refreshed 2026-07-15 (America/Los_Angeles)

## Verdict

The Nuxt layer and Stir Tools together are a strong candidate for a coordinated vNext architecture rebuild, but not for a clean-slate behavior rewrite.

The reliable behavior should be preserved: Drupal Custom Elements rendering, proxy and cookie security, webform behavior, authentication flows, accessibility work, consumer overrides, and performance baselines. The part worth rebuilding is the platform boundary: how capabilities are packaged, enabled, imported, configured, tested, and released.

**Confirmed platform decision:** the vNext Stir Tools line targets Drupal 11 and later. Drupal 10 compatibility declarations, dependencies, shims, and code paths will not be carried into vNext. Existing Drupal 10 consumers migrate through the current production line. Drupal 12 support will be declared only after the relevant clean-install, update, quality, deprecation, runtime, and contract suites pass against it.

Both repositories are already substantially healthier than their history might suggest. The Nuxt layer's recent `core` / `theme` / `auth` split, security documentation, contract tests, packed-consumer test, accessibility harness, and performance budgets are good foundations. Stir Tools has similarly strong Drupal service separation, cacheability work, endpoint tests, and module-level QA. Their current boundaries nevertheless remain largely conventional rather than executable: optional capabilities are still pulled in broadly and the PHP/TypeScript contract is maintained independently on both sides.

## What is already working well

- It uses the Nuxt 4 `app/` and `server/` structure correctly inside its layers.
- The app is wrapped in `UApp`, Nuxt UI semantic tokens are used broadly, and expensive features such as editing and motion are deferred.
- The Drupal boundary is unusually deliberate: session-cookie filtering, upstream redirect rejection, API-key handling, same-origin mutation checks, request limits, and private caching are documented and tested.
- Custom Element rendering and downstream override behavior are treated as contracts rather than implementation details.
- There are meaningful unit, Nuxt runtime, server, consumer-build, accessibility, and performance tools.
- The repository's own [July architecture review](https://github.com/StirStudios/nuxtjs-drupal-stir/blob/dev/docs/architecture-review-2026-07.md) contains useful measurements instead of relying on intuition.

Those strengths are why vNext should reuse and port behavior rather than recreate it from memory.

The Nuxt delta from `a8bb7aab` through `f5912d9` was re-audited after the initial review. Five commits changed 16 files, adding focused tests while extracting Drupal View query construction and stored-state validation, separating media-modal rendering from layout composition, extracting deferred video-source lifecycle handling, sharing Nuxt UI carousel-button normalization, and removing the transitive Rollup type dependency. `useDrupalViewControls.ts` fell from approximately 757 to 602 lines, and `Paragraph/Media.vue` is now a 217-line coordinator with the 201-line modal isolated. These are healthy refinements that directly support the recommended pure-policy/coordinator split; they do not invalidate the broader capability, contract, Drupal, or distribution findings. The refreshed full-preset initial-client result is 191.27 kB gzip and remains effectively flat.

## Stir Tools review baseline

Stir Tools is not ancillary tooling. It is the Drupal-side platform that produces the Custom Elements, media, layout, Webform, auth, app-context, SEO, sitemap, and editorial contracts consumed by the Nuxt layer. It contains 27 top-level submodules; the largest areas are `stir_layout_builder`, `stir_bunny`, and `stir_account`.

The reviewed local checkout was clean on `dev`. Its baseline is healthy:

- 809 unit tests passed with 5,847 assertions.
- Drupal PHPCS completed without findings.
- PHPStan completed with no errors.
- CI also covers PHP 8.4/8.5, SQLite kernel/browser tests, deprecations, and installation in a Drupal consumer layout.

The architectural conclusion is to keep Stir Tools and the Nuxt platform as separate repositories and separately deployable products. They should share an explicit, versioned data contract—not PHP/TypeScript runtime source and not release lockstep for unrelated admin features.

## Consumer evidence: RSF and DancePlug

RSF and DancePlug were reviewed as read-only consumers because they reveal the platform's actual extension points better than the base repositories alone. Both contained existing local changes, which were preserved; the commit identifiers above describe the reviewed baselines, not clean working-tree claims.

The two projects use the platform differently:

- RSF is comparatively close to the base and demonstrates which visual/content components appropriately remain project-owned.
- DancePlug is an override-heavy product with classes, editorial content, progress, favorites, subscriptions, access rules, and several card/listing variants. It is the better stress test for where generic Drupal data stops being immediately usable.
- Both still carry explicit Custom Elements display configuration. RSF has 19 entity CE display configurations, with 85 fields using `auto`; DancePlug has 36, with 163 `auto` fields plus repeated `stir_entity_reference`, `stir_text`, and `stir_media` formatter selection.
- DancePlug's Nuxt app adds generic-looking adapters such as an entity-reference renderer, text-with-summary passthrough, Drupal markup extension, slot parsing, and node-card normalization. Some of this is valid product composition, but the repeated field/VNode normalization belongs lower in the platform.
- DancePlug's backend card and response-alter services often traverse already-produced CE payloads, resolve entities again, and enrich them for the frontend. That is evidence that common summary/reference/media contracts should be produced correctly at the entity view-mode boundary instead of repaired after serialization.

This does not mean the platform should absorb all DancePlug behavior. Stripe, class access, progress, Bunny-specific policy, editorial product variants, and branded presentation remain consumer concerns. The vNext opportunity is to make standard Drupal fields, references, media, cards, and layout structure predictable enough that project code focuses on those real business differences.

## Main findings

### Resolved since review — `dev` is green

At review time, [`dev` run 29391570459](https://github.com/StirStudios/nuxtjs-drupal-stir/actions/runs/29391570459) failed because the bundle-report code depended on transitive Rollup types. This was subsequently fixed in commit `f5912d9` (`fix: remove transitive Rollup type dependency`). The latest verified [`dev` run 29393327158](https://github.com/StirStudios/nuxtjs-drupal-stir/actions/runs/29393327158) is green: the quality job and both consumer typecheck/build jobs passed. This failure is closed and must not be carried into the vNext implementation backlog.

The separate architectural question remains whether repository-only bundle-analysis tooling should live in the published consumer config. Development diagnostics that consumers do not use should move to a workspace/playground config during the capability split, but that is now a normal cleanup item rather than a CI blocker.

Recommendation: preserve the current green baseline and move diagnostics only when the vNext workspace boundary is introduced, with the existing performance reports retained.

### P1 — The Drupal/Nuxt contract is handwritten and has already drifted

The two repositories describe the same endpoints and payloads independently, but neither CI workflow tests the other repository or validates a shared schema. The only general Nuxt fixture, `tests/fixtures/drupal-contracts.json`, is checked for a handful of key names rather than parsed through the production readers.

The combined review found concrete drift:

- `stir_account` returns `approval_required` for administrator-approved registration. The Nuxt `RegisterResponse` omits it, and the registration UI treats a response without email verification as an immediately usable account. An approval-pending user can therefore be told that they can sign in.
- `ParagraphWebformPayloadBuilder` returns `webformConfirmationType`, `webformRedirect`, and a nullable `webformSubmissions`. The Nuxt `WebformDefinition` omits both redirect fields and declares the submissions link as a required string. `WebformForm.vue` never applies the backend redirect behavior.
- The Nuxt sanitized fixture represents a Webform as `{ id, title, elements }`, while the actual producer emits `{ webformId, webformTitle, fields, actions, ... }`. Its test therefore passes while describing a payload the renderer does not consume.
- Auth configuration has its own `version: 2`, but the broader CE, media, app-context, Webform, sitemap, and endpoint contract has no executable version or compatibility manifest.

Recommendation: make Stir Tools the producer source of truth for machine-readable JSON Schema/OpenAPI documents and sanitized payload fixtures. Publish those as a small versioned contract artifact used only at build/test time. Generate or validate Nuxt types and adapters from the artifact, validate Drupal producer tests against it, and add a release compatibility manifest. Keep intentional compatibility normalization at the Nuxt server boundary rather than throughout components.

### P1 — Stir Tools also makes optional capabilities mandatory

The root `stir_tools.info.yml` describes shared services, but it requires a wide baseline including Admin Toolbar, Config Split, Gin Toolbar/Login, Metatag extensions, Pathauto, Paragraphs, and Token. `stir_layout_builder.info.yml` then directly requires Webform/Webform UI, Webform REST, Gin, login switching, REST UI, Custom Elements, and Field Group.

As a result, enabling the core decoupled layout capability also enables admin and feature integrations that a particular project may not need. This mirrors the Nuxt root layer always installing auth, editor, analytics, and other capabilities.

Recommendation: reduce the Drupal root to genuinely shared media/contract primitives; make the layout/CE core independent of Webform, Gin, login switching, Bunny, and other integrations; move those to optional bridge submodules; and preserve today's experience through a full compatibility preset or installer. The minimal/full feature matrix must apply to both the Drupal and Nuxt sides.

### P1 — Drupal 10 is advertised but unverified and outside the vNext target

The repository and engineering guidance describe Drupal 11+ and PHP 8.4+ as the target, and Composer/CI install Drupal 11. However, 43 module metadata files declare `^10 || ^11`, two declare `^10.1 || ^11`, and only six declare `^11`. Drupal 10 compatibility is therefore advertised much more broadly than it is verified.

Drupal 12 is planned for early December 2026, so it is not yet an honest production compatibility claim at this review date. Official upgrade guidance also requires sites coming from Drupal 10 to reach Drupal 11.3 or later before moving to 12. See the [Drupal 12 release tracker](https://www.drupal.org/project/drupal/issues/3449806) and [major-version upgrade overview](https://www.drupal.org/docs/upgrading-drupal/upgrading-drupal/upgrade-process-overview).

Decision: make vNext explicitly Drupal 11+ and Drupal 12-ready. Remove Drupal 10 compatibility from the new line while keeping the current production line stable for migrations. Test supported Drupal 11 minors as blocking CI, add a Drupal 12 prerelease compatibility job when releases are installable, and change `core_version_requirement` to include `^12` only after the full module/contract suite passes.

### P1 — Tailwind is currently a database and API contract

Stir Tools stores or generates Tailwind class strings for grid items, spacing, width, alignment, and freeform paragraph classes. `GridItemsConfigHelper` mirrors frontend breakpoints and spacing units, while `ThemingHelper` expands editorial values into classes such as `p-10 lg:p-20`. The Drupal README consequently requires the frontend safelist to know every class Drupal may emit.

The current Nuxt `safelist.inline.css` is approximately 10 KB and contains about 1,095 whitespace-separated entries/directive tokens. It uses Tailwind 4's supported `@source inline()` mechanism, but it includes the broad possibility space rather than the much smaller set a particular project actually uses.

This is functional, but it couples stored content and backend releases to the frontend Tailwind build and makes evidence-based CSS reduction difficult. It also makes a Tailwind implementation detail part of the permanent CMS schema.

Recommendation: new contracts should emit constrained semantic values such as spacing, width, alignment, columns, and gap—not completed class strings. The Nuxt renderer should map those finite values to statically discoverable Tailwind recipes or Nuxt UI variants. Retain one isolated legacy class translator and the existing safelist while auditing and migrating stored content; do not remove CMS-driven classes based only on source scans.

Add a versioned **CMS presentation-usage manifest** to that migration path:

- Stir Tools owns an exporter service with an authenticated build endpoint and a Drush/local-file adapter. The manifest contains its schema version, site/theme identity, deterministic revision/hash, used semantic presentation values, enabled presentation capabilities, and filtered legacy classes. It contains no content or arbitrary unvalidated CSS.
- Nuxt validates the manifest during prepare/build, maps semantic values through its finite presentation recipes, combines them with any validated legacy utilities, and generates a Tailwind 4 source containing literal `@source inline()` utilities. Tailwind documents this as its current [specific-utility safelisting mechanism](https://tailwindcss.com/docs/detecting-classes-in-source-files#safelisting-specific-utilities).
- A content/configuration change that introduces a new used value changes the manifest hash and triggers the Nuxt deployment webhook. The production artifact records the manifest hash it was built against, making Drupal content and CSS compatibility observable.
- Production strict mode fails a build on an invalid or unavailable changed manifest; it never silently ships incomplete CSS. A verified last-known manifest may be used only under an explicit availability policy. Development and compatibility builds can generate the complete finite `allowed` set.
- Rollout is hybrid: generate the `used` set plus a small reviewed reserve for high-frequency editorial choices until webhook reliability and publish timing are proven. Compare missing-utility telemetry and compiled CSS before moving to exact-used mode.
- Freeform class fields are not trusted as a Tailwind generation API. Legacy values pass through a narrow allowlist/parser, while new editorial controls use semantic tokens. Arbitrary values, unknown variants, and utilities outside the site's design policy are rejected and reported.

This gives each project a substantially smaller CSS candidate set without making a published page depend on a class that the deployed Nuxt build has never seen. It also creates a measurable path for retiring the blanket legacy safelist rather than guessing which classes are unused.

### P1 — Common Drupal fields are configured twice and normalized too late

The current stack has two competing field-output modes. Custom Elements can seed fields from an entity view display using its `auto` formatter when CE display configuration is empty. Stir's force-auto processing instead bypasses that CE field table and applies its processor registry. Some RSF configurations set `forceAutoProcessing: true` while still declaring individual formatter configuration, which makes the saved display look authoritative even though that table is not the active path.

DancePlug then compensates at both ends: backend payload managers turn entity references, categories, images, dates, and summaries into card shapes, while frontend components/composables parse VNode slots back into similarly normalized data. The result works, but a standard field can require Drupal display configuration, a Stir processor/formatter, TypeScript interpretation, and a Vue renderer before it feels native.

Recommendation: make a dedicated decoupled entity view mode the exposure and presentation boundary, then generate/synchronize CE configuration from it through a versioned field-contract registry. Preserve explicit bundle/field overrides, but do not mix force-auto and display-driven behavior in one configuration.

The registry should cover at least:

| Drupal field family | Stable contract |
| --- | --- |
| Scalar, number, boolean | Typed scalar for single cardinality; ordered typed array for multi-value fields |
| List/options | `{ value, label }` rather than requiring the frontend to rediscover allowed-value labels |
| Link | `{ url, title, options? }`, with resolved internal URLs and access respected |
| Date/range | ISO values, timezone/range metadata, and an optional Drupal-produced display label |
| Entity reference | `{ id, uuid, entityType, bundle, label, url? }`; optional summary view-mode representation when requested |
| Text/summary | Safe rendered slot plus explicit summary/format metadata where needed |
| File/image/media | A normalized media contract with URL or sources, alt, dimensions, metadata, and cacheability—not raw field internals |
| Paragraph/entity-reference revisions | Ordered rendered children or references based on the selected decoupled view mode |
| Unknown contributed field | Generic typed representation and a development/CI diagnostic; never silent disappearance |

Adding an ordinary field should then be: enable it in the bundle's decoupled view mode, export/synchronize the contract, and let the generic Nuxt renderer handle it. Only a new semantic presentation or business behavior should require custom PHP or Vue. Exposure remains opt-in through the view mode; automatically publishing every stored field would be unsafe and unnecessarily large.

### P1 — Drupal Views is doing work that high-traffic listings should not require

DancePlug provides especially useful performance evidence. Its current class and editorial listing APIs were added specifically as optimized alternatives to rendering the equivalent Drupal Views. They query only the ordered/paged entity IDs, run a separate count, bulk-load the current page, normalize a lean card representation, and return explicit filter/pager metadata. Anonymous listing responses are cacheable for an hour with list tags and query/path/access contexts; genuinely personalized class progress adds the `user` context and disables shared caching. Instructor profiles and dashboards were similarly changed toward bounded queries and bulk loading.

Stir Tools has already absorbed two good parts of that work: `LightweightListingHelper` standardizes request parsing and cacheable listing responses, while lightweight media mode avoids detail image sources and embeds for card rows. Its generic paragraph-View processor still executes the full Views render pipeline, extracts its render array, reconstructs CE rows, and derives filters/pager metadata. That is appropriate for flexible editor-selected embedded Views, but it is too expensive a default for a high-traffic, faceted public catalogue.

The vNext rule should be two explicit paths:

| Listing kind | Runtime path |
| --- | --- |
| Small, flexible, editor-selected embedded View | Drupal Views + CE renderer, using a lightweight row view mode, Views result/render caching where valid, strict page size, and fully bubbled cacheability |
| Configurable public listing that benefits from Views UI | A `Stir Listing API` Views display/provider executes the View query and pager but skips the full display/field render pipeline; ordered IDs are bulk-loaded into the same summary contract as code-backed listings |
| High-traffic public listing, multiple facets, deterministic sorting, or SSR-critical route | Typed lightweight listing endpoint that selects IDs first, pages before entity rendering, bulk-loads, emits summary/card contracts, and returns its own pager/filter metadata |
| Personalized listing/progress/favorites | Same lightweight endpoint pattern, with public base data separated from a small private/user-specific overlay wherever possible |
| Search over substantial body/content data | Drupal Search API and an appropriate indexed backend when justified; do not scale repeated `%LIKE%` joins over unindexed body tables indefinitely |

For a normal Drupal page, a View using **Fields** can be convenient because Drupal renders the final table/list markup. That is not the best general decoupled contract once bundles contain media, references, and Paragraphs. Use Fields output only for intentionally flat projections such as tables, exports, option lists, or small data feeds. For content cards, use a dedicated entity `card`/`teaser` view mode and render the entity representation. That preserves field formatter/access/cache behavior without asking the View to understand each bundle's Paragraph structure. Full Paragraph trees and full/detail view modes should not be present in listing rows; expose a deliberate summary, preview media item, or precomputed semantic value instead.

Drupal 11's `ViewExecutable::execute()` is explicitly the query-execution step, separate from `render()`. A View-backed listing provider can therefore retain Views UI for filters, relationships, contextual filters, sorting, paging, and result caching while bypassing the expensive row/display rendering that the Nuxt API does not need. This path must be benchmarked against both the current CE-rendered View and a direct provider before it becomes the default, but it is the missing middle ground between “render the whole View” and “make every listing invisible code.” See Drupal's [`ViewExecutable::execute()` API](https://api.drupal.org/api/drupal/core%21modules%21views%21src%21ViewExecutable.php/function/ViewExecutable%3A%3Aexecute/main).

Create an optional `stir_listing` capability rather than growing a generic helper in the root module. It should own a versioned listing response schema, validated request parsing, sort/filter definitions, cacheable response construction, an ID-query/provider interface, summary entity normalization, and instrumentation. It should offer at least two provider plugins:

- `views`: points to a real View/display visible in Views UI and uses query execution without full row rendering;
- `code`: implements a bounded project-specific ID query for cases Views cannot express or cannot execute within the route's budget.

Listing definitions should be exportable Drupal configuration containing a stable ID/label, provider, summary view mode, allowed filters/sorts, page-size limits, personalization policy, and cache policy. An admin inventory page should show every listing endpoint—including code providers—its source, contract version, filters, cache behavior, and last measured performance. It should not attempt to recreate the entire Views query builder.

The current DancePlug `/api/editorial/*` and class APIs are code-backed listings, not Drupal Views, and should be named/documented that way. DancePlug currently has no exported `views.view.*` configuration in the reviewed config tree, which explains why those listings cannot be inspected in Views UI. VNext should make them discoverable through the listing inventory without pretending that their complex product query logic is a View. Stir Tools must not know DancePlug field table names or product rules; DancePlug continues to own its class/editorial definitions, access/progress semantics, event occurrence logic, and any direct SQL or Search API provider needed to implement them.

Every listing route should have measured budgets for database query count/time, entity loads, render time, response bytes, cache metadata, and cold/warm latency. Use `EXPLAIN` against representative data before adding indexes; validate count-query cost independently; preserve the selected ID order after `loadMultiple()`; avoid N+1 reference/media loads; and do not compute every facet on every request when a cacheable/precomputed option set is sufficient. Exact total counts may become optional for very large datasets where they cost more than their UX value.

This does not declare Drupal Views intrinsically slow or obsolete. It limits the full Views rendering system to the situations where its configurability is worth the runtime cost and gives performance-critical decoupled routes a contract designed for their actual job.

### P1 — Layout Paragraphs structure is reconstructed after serialization

Stir Tools currently receives a flat CE `section` slot, indexes elements by `props.uuid`, and rebuilds parent/region relationships in `LayoutRegionGrouper` after the Lupus response already exists. It also reads serialized `behavior_settings` directly. Layout Paragraphs already exposes layout, component, section, parent, region, settings, ordering, access, and renderer concepts; the bridge should consume those domain APIs while producing the field, not reconstruct their meaning from serialized storage and transport props later.

The current reconstruction has concrete correctness risk beyond awkwardness:

- Children are attached by value from a lookup. With nested layout containers, a child container can be copied into its parent before its own descendants are attached, making multi-level output dependent on processing order.
- Existing grouping tests cover region order and one-level/single-region normalization, but not arbitrary layout-inside-layout depth, orphans, invalid regions, or access-denied descendants.
- `LayoutVisibilityFilter` runs after grouping but only filters the top-level array. It checks `regions` when the grouper writes children to `slots`, so it does not reliably remove nested hidden children or empty grouped containers.

Recommendation: create a focused Layout Paragraphs–Custom Elements bridge—initially a Stir Tools submodule, and an upstream contribution if it proves generic. At field rendering time it should build `LayoutParagraphsLayout`, walk sections and components in declared region order, check access, render child entities through Custom Elements, bubble cacheability, and emit the final `paragraph-layout` region slots directly. `parentUuid` and `region` may remain optional diagnostics, but they should not be required to reconstruct the public response.

Use one-region layouts for repeated collections where regions have no distinct meaning; keep multiple regions when the editorial regions are genuinely semantic. Before migration, add fixtures for multiple nesting levels, disabled/unpublished/access-denied children, missing parents, invalid regions, empty layouts, translations, and cache metadata.

### P1 — Paragraphs remains valid, but it should not own every content and layout concern

Paragraphs is not obsolete. Its current 1.21 line is maintained and security-covered, and recent releases include Drupal 11.3 performance work. [Paragraphs releases](https://www.drupal.org/project/paragraphs/releases) confirm that it remains a viable Drupal 11 structured-content tool. It is particularly appropriate for repeatable, fieldable components that belong to one host entity and should share that entity's revision lifecycle.

Layout Paragraphs is a separate decision. It supplies a useful visual arrangement UI over those owned components, but it also makes paragraph behavior metadata responsible for parentage, regions, and presentation. The current stable line is 2.1; 3.0 remains beta while modernizing its interaction model and removing older JavaScript dependencies. DancePlug currently uses 3.0.0-beta2 plus a local PHP 8.4 patch, which is workable but not the dependency posture to make mandatory across every vNext site. See [Layout Paragraphs releases](https://www.drupal.org/project/layout_paragraphs/releases).

Drupal Canvas has now changed the options. Canvas is not a Drupal core module; it is a strategic, security-covered contributed project shipped as a central part of Drupal CMS 2.0. Canvas 1.8 supports Drupal 11.3, includes translation support, and explicitly supports coupled and headless composition. Drupal documents a Vue-compatible External JavaScript Components route with SSR and Lupus Decoupled integration. See [Drupal Canvas](https://www.drupal.org/project/canvas), [Drupal CMS 2.0](https://www.drupal.org/blog/drupal-cms-20-is-here-visual-building-ai-and-site-templates-transform-drupal), and [Decoupled Drupal Canvas](https://www.drupal.org/docs/develop/decoupled-drupal/decoupled-drupal-canvas).

Canvas is nevertheless not an automatic Paragraphs replacement for these existing projects. First-class Paragraphs-to-Canvas migration/component-source work is still an active integration area, so moving years of Paragraph content now would exchange known complexity for a new migration and component-governance problem. See the [Paragraphs-to-Canvas component-source work](https://www.drupal.org/project/canvas/issues/3517216).

Use the following content-model rule instead of selecting one tool globally:

| Need | Preferred Drupal model |
| --- | --- |
| Stable property of a content type, such as title, date, category, author, or hero media | Direct entity field; no Paragraph wrapper |
| Repeatable structured component owned by one page and revised with it | Paragraph |
| Content that must be independently reused, related, searched, listed, permissioned, or addressed | A first-class content entity such as node, media, taxonomy term, or a focused custom entity—not an embedded Paragraph |
| Existing visually composed pages whose components already live in Paragraphs | Layout Paragraphs, behind the corrected direct-tree bridge |
| New marketing/landing-page composition in first vNext projects | Layout Paragraphs through the simplified direct-tree bridge; evaluate Canvas separately and promote it only after the governance and simplicity gates pass |
| Consistent entity display templates and site/block regions | Core view modes/Layout Builder or Canvas content templates, depending on whether the layout is developer-governed or editor-composed |

The frontend contract should not reveal which authoring system produced the page. Define one canonical component tree—element/component ID, typed props, named slots, cacheability, and editorial metadata—and add producer adapters only for systems actually enabled:

- direct entity fields/view modes;
- Paragraphs;
- Layout Paragraphs;
- Canvas through the maintained Lupus/Custom Elements integration;
- core Layout Builder only where a project genuinely uses it.

Nuxt then renders the same contract and component registry regardless of source. A versioned component manifest should drive both Nuxt component/type registration and, where feasible, Canvas External JavaScript Component definitions so props, slots, variants, and allowed nesting are not handwritten twice. Tailwind classes remain a frontend implementation detail; Canvas or Paragraph storage should hold constrained semantic variants.

#### Canvas evaluation gate for a later authoring-system change

Stir Tools itself is evidence that Layout Paragraphs has become restrictive for this platform. Stir has had to add static layout/region definitions, serialized `behavior_settings` interpretation, UUID/parent/region transport props, post-response tree reconstruction, nested paragraph lineage/revision handling, visibility cleanup, layout-class generation, grid-aware media sizing, custom edit-link flows, and paragraph-bundle synchronization. Some of that work adds genuine Stir value, but much of it compensates for a page-composition model that does not naturally produce the decoupled component tree Nuxt needs. The existing nested-grouping and visibility correctness risks show that this is architectural maintenance cost, not merely an editor-interface preference.

The production default for the first vNext build should be **Layout Paragraphs, simplified and isolated behind the new source-independent component contract**. This is not an endorsement of all the current custom integration. It is the lowest-risk way to preserve the intentionally constrained, Drupal-admin/Gin editing experience while replacing flat response grouping and other compensating code with the direct nested-tree bridge described above.

Canvas should be a contained research track, not a dependency of the rebuild. Build one small representative landing page with the same Stir component manifest, but do not migrate content, expose it to clients, or make upcoming projects wait for it. Promote Canvas to a production option only after it proves a genuinely simpler **content-only layout mode** with stable governance. Because Nuxt consumes the source-independent component tree, that later change is an adapter decision rather than another frontend rebuild.

Canvas's broad product positioning—letting site builders create components, CSS, themes, templates, and global regions in the browser—describes its maximum authority, not the authority Stir should grant to clients. The Stir product must operate as **Governed Canvas**: developers define and version the design system, while client editors compose only within bounded content areas using approved components, semantic options, and validated nesting.

| Canvas authority | Trusted Stir developer/administrator | Client editor |
| --- | --- | --- |
| Component JavaScript/JSX, CSS, metadata, props, and slots | Managed in a local codebase and Git; deployed through a supported CLI/config workflow | No access |
| Component catalogue and grouping | Enables, disables, categorizes, and versions the approved library | Sees only the role-approved subset |
| Theme, global CSS, design tokens, templates, header, footer, and global regions | Owns and deploys | No access |
| Page composition | Can create templates and diagnose any composition | May add, edit, move, duplicate, and remove approved components only inside the page-content canvas |
| Component values | Defines typed schemas, enums, defaults, validation, and migrations | Edits only approved semantic fields/variants; never raw Tailwind classes or arbitrary CSS |
| Slots and nesting | Defines allowed child types plus minimum/maximum cardinality | Can place only valid children in valid slots |
| Publishing | Configures revisions, moderation, recovery, scheduling, and access | Uses the project's assigned workflow and permissions |

As of this review, Canvas has useful pieces of this separation but not yet the complete, proven governance model Stir requires:

- code-component editing is separated by the restricted `administer code components` permission, and SDC components can be enabled or disabled globally;
- the official CLI/local-codebase workflow can keep component source in Git, although the exact CLI/config-sync source-of-truth workflow is still being refined upstream;
- per-role component-library restrictions currently depend on the new `canvas_component_access` contributed module, whose first alpha is minimally maintained and not covered by Drupal's security advisory policy;
- Canvas enforcement for slot `expected` children and minimum/maximum cardinality remains active upstream work rather than a completed capability Stir can assume;
- a dedicated permission that lets editors modify page content without modifying global header/footer regions is still an active upstream issue; and
- the Drupal CMS documentation states that content-moderation workflows are not yet available for Canvas pages.

Those are blocking product concerns, not optional polish. VNext must not depend on an alpha, non-security-covered access module, a large Stir-only access-control patch, or policy enforced only by hiding controls in the browser. See [Canvas code components](https://project.pages.drupalcode.org/canvas/code-components/), [Canvas SDC component status](https://project.pages.drupalcode.org/canvas/sdc-components/troubleshooting/), [Canvas Component Access](https://www.drupal.org/project/canvas_component_access), [slot restriction enforcement](https://www.drupal.org/project/canvas/issues/3563163), [global-region permission work](https://git.drupalcode.org/project/canvas/-/work_items/3584713), [Canvas code-component sync work](https://www.drupal.org/project/canvas/issues/3591147), and [Drupal CMS moderation guidance](https://project.pages.drupalcode.org/drupal_cms/manage/moderation/).

| Required capability | Evidence required from the pilot |
| --- | --- |
| Component coverage | Every currently supported Stir page component has a Canvas definition mapped to the same versioned Nuxt props/slots contract |
| Add/edit/reorder/duplicate/remove | Editors can complete the normal component lifecycle without developer intervention or data corruption |
| Editorial governance | A client role cannot author code/CSS/components, change the theme, templates, tokens, header/footer/global regions, or see components outside its approved library; controls are enforced server-side, not merely hidden in the UI |
| Layouts, regions, nesting | Grid and semantic multi-region compositions work with enforced allowed-child/cardinality rules; no frontend reconstruction from storage metadata |
| Rich text, links, media, references | Existing editorial field and Media Library workflows remain usable and emit normalized contracts |
| Views, listings, Webforms, menus/blocks | Required dynamic Drupal components can be placed or referenced without embedding full uncontrolled payloads |
| Live Nuxt preview | The Canvas editor previews the real Vue/Nuxt component closely enough to make layout decisions, with clear handling for authenticated/dynamic states |
| Revisions, autosave, moderation, scheduling, visibility | The workflows currently relied upon by Stir projects have equivalent behavior, permissions, and recovery paths |
| Translation | Component content and structure can be translated without losing other language revisions or layout integrity |
| Access and security | Drupal remains authoritative; unpublished, inaccessible, and editor-only data never leaks through the page API or preview boundary |
| Cacheability | Entity/config/access dependencies produce correct tags, contexts, and max-age through Lupus and the Nuxt proxy |
| Decoupled SSR/hydration | A Canvas page resolves through Lupus, renders on the server, hydrates without errors, and supports routes/metatags/redirects/previews |
| Performance | Representative Canvas pages meet or improve the agreed query, render-time, payload, Nuxt SSR, JavaScript, and Lighthouse budgets versus Layout Paragraphs |
| Component evolution | Adding/renaming props and slots has a versioned update/migration path for existing Canvas component instances |
| Accessibility | Canvas authoring and the produced page pass the project's keyboard, semantics, focus, and automated/manual accessibility checks |
| Maintenance boundary | Production uses stable security-covered releases and supported extension points; no substantial Stir fork or long-lived core patch is required |

“Everything Layout Paragraphs does” means everything the Stir platform and real consumers depend on, not every incidental feature in either module. Optional features may differ, but no currently used blocking workflow is accepted as a future fix.

Build the same small representative landing page in both systems and capture the matrix as executable tests and measured results. Test with separate developer, content-administrator, editor, reviewer, and anonymous roles—not only an administrator account. Layout Paragraphs remains the production default until every blocking row passes using stable, supported controls and Canvas is demonstrably simpler for both editors and maintainers. A trusted-agency-only Canvas workflow may be useful as a limited pilot, but it does not prove that Canvas is safe to expose to client editors.

Existing Paragraphs content is not part of this immediate replacement decision. VNext retains Paragraphs and Layout Paragraphs compatibility for established sites, stops making Paragraphs a root requirement for unrelated capabilities, and considers existing-site migration only after Canvas succeeds in production and a separately tested content migration path exists.

### P1 — Keep Lupus and `nuxtjs-drupal-ce`; own a stable Stir adapter, not a fork

Going fully independent is not justified by the evidence. [Lupus Decoupled](https://www.drupal.org/project/lupus_decoupled) remains a security-covered Drupal 11-compatible project that already owns page routing, previews, authentication integration, redirects, metatags, messages, and the component-oriented API. [`nuxtjs-drupal-ce`](https://github.com/drunomics/nuxtjs-drupal-ce) is actively maintained for Nuxt 4; its current 2.7 line provides wildcard page routing, SSR data, component resolution/fallback, menus, messages, previews, and Drupal library loading. Stir is already contributing generally useful fixes and proposals upstream, including the [PageRoute wrapper proposal](https://github.com/drunomics/nuxtjs-drupal-ce/issues/457).

The current Nuxt base does, however, depend on an upstream implementation detail: it removes the module's generated proxy handler by matching its source path, then installs a security-hardened replacement. The upstream renderer also silently resolves unknown Custom Elements to nothing and provides no first-class field normalization/diagnostic hook. These are extension seams to propose upstream, while containing today's behavior behind a Stir-owned facade.

Recommendation:

- Keep Lupus, Custom Elements/CE Renderer, Layout Paragraphs, and `nuxtjs-drupal-ce` as upstream kernels.
- Put all Nuxt usage behind `@stir/nuxt-drupal`: secure proxy policy, payload validation/normalization, missing-element diagnostics, generated contract types, and standard field components.
- Request upstream hooks for proxy request/response policy, configurable handler ownership, render transforms, and unresolved-component diagnostics. Contribute generic improvements rather than carrying private patches.
- Pin and test a compatible upstream range. Consumers import the Stir facade, not upstream internals, so upstream can be upgraded—or replaced later—without another project-wide rewrite.
- Fork or replace only if required security, Nuxt compatibility, or extension points remain blocked across releases and the maintenance cost is measured to be lower than the adapter/contribution path.

This creates real Stir ownership without taking responsibility for an entire routing/rendering stack that is currently maintained elsewhere.

### P1 — Documented environment variables are mainly build-time inputs

Many runtime-config defaults are populated from differently named variables such as `DRUPAL_API_KEY`, `PROTECTED_PASSWORD`, and `TURNSTILE_SECRET` in [`nuxt.config.ts` lines 244–300](https://github.com/StirStudios/nuxtjs-drupal-stir/blob/dev/nuxt.config.ts#L244-L300).

Nuxt only performs production runtime replacement through matching `NUXT_*` names. A differently named `process.env` value is a build-time default. This matters when one built artifact is promoted between environments; it can also encourage build-time secret embedding. Nuxt documents this explicitly in its [runtime-config guidance](https://nuxt.com/docs/4.x/guide/going-further/runtime-config#environment-variables).

Recommendation: give runtime config empty, serializable defaults and standardize on names such as `NUXT_STIR_DRUPAL_API_KEY`, `NUXT_STIR_PROTECTED_PASSWORD`, and `NUXT_PUBLIC_STIR_DRUPAL_BASE_URL`. Keep the old names temporarily as build-time compatibility aliases with warnings. If every deployment always rebuilds, document that constraint clearly.

### P1 — The three layers are not independent capabilities

The root config always extends `core`, `theme`, and `auth`, then always installs Nuxt UI, Scripts, Vitalizer, Turnstile, Robots, Sitemap, and Drupal CE; Plausible is present outside tests. See [`nuxt.config.ts` lines 31–33 and 199–242](https://github.com/StirStudios/nuxtjs-drupal-stir/blob/dev/nuxt.config.ts#L31-L33).

`authIntegration.drupalAccounts: false` hides behavior, but the auth pages, server routes, composables, components, and three global middleware files remain registered. Similar no-op-at-runtime patterns exist for global SEO, UserWay, Plausible, privacy, popups, and editing.

Recommendation: make these build-time capabilities. Applications that do not use auth, editing, analytics, or Webforms should not register their routes, middleware, plugins, types, or dependencies.

### P1 — Reserved aliases have become a compatibility trap

The layer globally redirects `~/utils`, `~/composables`, `~/components`, and `~/types` to the theme layer in [`nuxt.config.ts` lines 191–197](https://github.com/StirStudios/nuxtjs-drupal-stir/blob/dev/nuxt.config.ts#L191-L197), mirrors them in TypeScript, and records them as public contracts in [`docs/public-contracts.json`](https://github.com/StirStudios/nuxtjs-drupal-stir/blob/dev/docs/public-contracts.json#L1-L10).

Nuxt 4 now resolves local layer aliases and supports named aliases such as `#layers/theme`; global `~/` imports normally belong to the consuming application. See Nuxt's [layer authoring guidance](https://nuxt.com/docs/4.x/guide/going-further/layers/#relative-paths-and-aliases) and [named layer aliases](https://nuxt.com/docs/4.x/guide/going-further/layers/#named-layer-aliases).

The current aliases solve historic pnpm/typecheck problems, but they also prevent a clean distinction between consumer code and layer code. They cannot be removed safely inside the current major because downstream overrides use them.

Recommendation: create an explicit vNext surface such as `#stir/*`, `#layers/stir-theme/*`, or package subpath exports. Retain `~/...` only in a compatibility preset while consumers migrate.

### P1 — The effective public API is far larger than the documented API

The review found roughly 374 exported symbols across auto-scanned composable, utility, and server-utility directories. Many names are generic: `useNode`, `useValidation`, `useDarkMode`, `useIntersectionObserver`, `formatCurrency`, and others. Almost all theme components are also auto-registered.

The machine-readable contract records aliases, routes, environment names, and conventions, but not the actual supported symbols, components, configuration keys, or lifecycle promises. Nuxt's [module best practices](https://nuxt.com/docs/4.x/guide/modules/best-practices#prefix-your-exports) recommend explicitly prefixed public configuration, composables, components, and routes.

Recommendation: move internal helpers out of auto-scanned directories; explicitly register only supported imports; prefix public APIs; and generate an API manifest checked by CI.

### P2 — Configuration exposes internal markup and CSS decisions

The default [`app.config.ts`](https://github.com/StirStudios/nuxtjs-drupal-stir/blob/dev/layers/theme/app/app.config.ts) is about 410 lines and its type augmentation is about 461 lines. `stirTheme` mixes stable behavior with internal class recipes for header slots, hero structure, footer atoms, Webform internals, cards, gradients, animation, and auth layout. The committed performance report shows this file contributing about 10 kB of rendered entry-module code before compression.

This makes downstream flexibility excellent in the short term, but turns DOM structure and Tailwind recipes into long-lived API. Nuxt UI already provides global variants, component slots, `ui` overrides, semantic colors, and scoped themes.

Recommendation: keep app config for semantic choices—layout mode, feature behavior, component variants, and content policy. Keep implementation classes beside their components or in Nuxt UI theme configuration. Preserve an escape hatch, but do not model every internal element as a permanent config key.

### P2 — The theme remains more branded than a reusable base

The shared defaults select lime/zinc, Inter, branded gradients, black cards, opinionated global heading rules, and `section { overflow-x: clip }`. See [`app.config.ts`](https://github.com/StirStudios/nuxtjs-drupal-stir/blob/dev/layers/theme/app/app.config.ts) and [`base.css`](https://github.com/StirStudios/nuxtjs-drupal-stir/blob/dev/layers/theme/app/assets/css/base.css#L1-L169).

Recommendation: separate a neutral renderer/design-system layer from a Stir visual preset. Consumer brands can then extend the neutral layer directly or opt into the Stir preset.

### P2 — Global shell data has two transports

`LayoutPageResponseComposer` appends `footer_menu` and `site_info` to CE page responses. `GET /api/app-context` returns the same values alongside region blocks. The Nuxt footer avoids its fallback request when page data exists, but region rendering loads app context and can cause both copies to travel on the same request path.

Recommendation: profile real routes and choose a canonical strategy: either one cacheable app-shell/app-context resource reused across the page, or embedded shell data with app-context limited to context-sensitive blocks. Preserve cache tags, access contexts, and single-request SSR deduplication whichever approach wins.

### P2 — The test suite has gaps despite its breadth

- The Nuxt runtime test config sets `modules: []` while still loading layer plugins and middleware. The current CI logs app-initialization errors from Nuxt Icon and color-mode code, yet all 52 runtime tests pass. See [`vitest.nuxt.config.ts`](https://github.com/StirStudios/nuxtjs-drupal-stir/blob/dev/vitest.nuxt.config.ts#L6-L20).
- The E2E server requests `/` and logs a Drupal-configuration 500 during startup, but the suite only asserts health, auth-config, and SEO endpoints. See [`health.e2e.spec.ts`](https://github.com/StirStudios/nuxtjs-drupal-stir/blob/dev/tests/nuxt/e2e/health.e2e.spec.ts#L1-L39).
- `test:consumer:packed` exists and is part of the local `verify:ci` command, but the GitHub workflow only runs consumer typecheck and build. Compare [`package.json` scripts](https://github.com/StirStudios/nuxtjs-drupal-stir/blob/dev/package.json#L31-L41) with [`.github/workflows/ci.yml`](https://github.com/StirStudios/nuxtjs-drupal-stir/blob/dev/.github/workflows/ci.yml).
- Accessibility and performance budgets are useful, but neither is a GitHub CI gate.

Recommendation: fail tests on Nuxt initialization errors; maintain separate minimal/full feature fixtures; provide deterministic mocked Drupal responses; assert homepage SSR and hydration; run the packed consumer in CI; and schedule accessibility/performance checks if they are too expensive per pull request.

### P2 — Several coordinators are still carrying too many responsibilities

Notable sizes in the reviewed branch:

- `useDrupalViewControls.ts`: approximately 602 lines after the refreshed query/state extractions (down from approximately 757)
- `useVideoPlayers.ts`: approximately 517 lines
- `App/Header.vue`: approximately 482 lines
- `server/utils/stirDrupalApi.ts`: approximately 480 lines
- `WebformForm.vue`: approximately 348 lines

The recent helper extractions are going in the right direction and validate this recommendation. Preserve them as the new baseline, then continue separating pure policy/state machines from Nuxt adapters and rendering where a coordinator still has multiple change reasons. File length alone is not the problem.

### P3 — Distribution and release contracts are ambiguous

The package is named `nuxtjs-drupal-stir`, consumers refer to it as `@stir/base`, npm publishing is disabled, deep CSS imports are required, and there are no package `exports` or `files` boundaries. The repository had 611 tags at review time, while real consumers appear to use the GitHub dependency contract, including `#dev` in the audit replacement logic.

Stir Tools has the related backend problem: its Composer package has an empty `require` section while Drupal module metadata declares many core/contrib dependencies, and there is no machine-readable statement of which Stir Tools release/contract is compatible with a Nuxt release. Optional submodules make blindly adding every dependency to the root package undesirable, but an empty Composer contract is not independently installable either.

Recommendation: adopt one canonical Nuxt package identity, explicit subpath exports, a changelog, a `next` prerelease channel, and pinned consumer versions. Deep imports should exist only where deliberately exported. For Stir Tools, choose an enforceable minimal-core plus optional-package/suggestion strategy and validate the supported install combinations. Publish backend/frontend compatibility through the shared contract manifest rather than relying on matching branch names.

## Recommended vNext shape

Treat this as one decoupled product with two repositories and a third, very small build-time contract artifact. The repositories remain independently deployable; the contract artifact is the only deliberate shared dependency.

### Drupal repository

| Artifact/capability | Responsibility |
| --- | --- |
| Minimal `stir_tools` core | Shared Drupal media and contract primitives with only required Drupal dependencies |
| Layout/CE core | Content structure, standard field contracts, CE processors, payload normalization, cacheability, and editorial layout behavior |
| Layout Paragraphs CE bridge | Optional direct construction of nested layout/region slots through Layout Paragraphs domain APIs |
| Canvas composition preset | Optional upstream Lupus/Canvas External JavaScript Components integration plus the Stir component-contract manifest; no private Canvas fork |
| `stir_listing` | Optional typed lightweight-listing toolkit and provider contract for performance-critical decoupled routes |
| Layout integration bridges | Optional Webform, Bunny, Instagram, Gin/admin, login, and other provider-specific integration submodules |
| `stir_layout_block` | Optional context-sensitive region blocks and app-context endpoint |
| `stir_webform_rest` + `stir_turnstile` | Authoritative Webform submission and abuse-validation capability |
| `stir_account` + `stir_turnstile` | Authoritative account, session, registration, password, and rate-limit policy |
| `stir_seo` / `stir_sitemap` | Optional CMS-backed SEO and sitemap resources |
| Full compatibility preset | Enables the same Drupal module set and behavior expected by existing projects |

### Shared contract artifact

| Contents | Rule |
| --- | --- |
| Endpoint definitions | Method, path, request, success/error response, cache/privacy behavior |
| CE, component, and field schemas | Element/component IDs, typed props, named slots/nesting rules, field families/cardinality, nullable/optional fields, and semantic layout values independent of Paragraphs or Canvas storage |
| Listing schemas | Items/summary view mode, filters, sorts, pager, active context, personalization, and cache/privacy policy |
| Capability/version manifest | Contract major plus required backend capability versions |
| Sanitized fixtures | Producer-generated representative page, view, media, Webform, auth, app-context, SEO, and error payloads |
| Generated TypeScript inputs | Development-only inputs for Nuxt types, validators, and contract tests; no browser runtime dependency |

This could be a small private `@stir/drupal-contracts` package or a versioned Stir Tools release artifact. The important property is one producer-owned source of truth, not the registry used to distribute it.

### Nuxt repository

Use modules for installation/runtime wiring, layers for overrideable application files, and plain libraries for framework-independent frontend logic.

| Artifact | Responsibility |
| --- | --- |
| `@stir/nuxt` | Thin orchestrator module with typed feature options and compatibility checks |
| `@stir/nuxt-drupal` | Drupal URL/config, secure proxy handlers, app context, CE integration, server utilities |
| `@stir/nuxt-renderer` | Override-friendly layer containing CE components, page rendering, media, and view presentation |
| `@stir/nuxt-listing` | Optional typed listing fetch/state/URL controls and generic Nuxt UI presentation primitives |
| `@stir/nuxt-theme` | Neutral Nuxt UI defaults, shell, tokens, CSS, layout components |
| `@stir/nuxt-webform` | Optional Webform renderer, field components, validation, and submit endpoint |
| `@stir/nuxt-auth` | Optional auth/account pages, routes, middleware, and server handlers |
| `@stir/nuxt-editor` | Optional Tiptap/admin editing capability |
| `@stir/nuxt-integrations` | Optional analytics, UserWay, popup/privacy, and third-party script adapters |
| `@stir/nuxt-preset` | Full compatibility preset matching today's layer for easy adoption |
| `@stir/nuxt-shared` | Pure frontend types, validation, normalization, and policy functions with no Vue/Nitro imports |

### Capability alignment

| Capability | Drupal producer | Nuxt consumer |
| --- | --- | --- |
| CE pages, layouts, views, media | Minimal Stir Tools + layout/CE core | `@stir/nuxt-drupal` + `@stir/nuxt-renderer` |
| Canvas-composed pages | Upstream Canvas + Lupus/Canvas bridge + Stir contract manifest | The same `@stir/nuxt-drupal` + renderer component registry; no Canvas-specific page components |
| Performance-critical listings | `stir_listing` + consumer query/provider implementation | `@stir/nuxt-listing` + consumer card/presentation components |
| App shell and contextual blocks | `stir_layout_block` | Drupal runtime + renderer shell |
| Webforms | Layout Webform bridge + `stir_webform_rest` + `stir_turnstile` | `@stir/nuxt-webform` |
| Accounts/auth | `stir_account` + `stir_turnstile` | `@stir/nuxt-auth` |
| Inline editing | Layout paragraph text endpoint | `@stir/nuxt-editor` |
| SEO and sitemap | `stir_seo` + `stir_sitemap` | Drupal runtime installing/configuring Nuxt SEO/robots/sitemap modules |
| Bunny/Instagram media | Optional backend provider bridges producing normalized media contracts | Generic renderer plus only provider-specific interaction code actually required |

These can remain in one pnpm workspace and release at one synchronized version; they do not need separate repositories.

### Upstream and Stir ownership boundary

| Concern | Owner in vNext | Reason |
| --- | --- | --- |
| Page API, Drupal path resolution, preview/auth/metatag/redirect integration | Lupus Decoupled upstream | Mature maintained foundation; replacing it adds broad responsibility without a demonstrated benefit |
| Entity-to-Custom-Element generation and CE rendering | Custom Elements / Lupus CE Renderer upstream | Generic Drupal capability; contribute broadly useful fixes upstream |
| Nuxt route fetch, CE rendering kernel, menus/messages/preview wiring | `nuxtjs-drupal-ce` upstream | Active Nuxt 4 implementation; consume through the Stir adapter rather than directly |
| Secure proxy policy, schemas, normalized fields, diagnostics, capability compatibility | Stir | These are Stir's product guarantees and currently exceed the upstream defaults |
| Layout Paragraphs-to-CE nesting | Stir bridge first; upstream candidate | It solves a real integration gap and can be contributed if it remains project-neutral |
| Canvas page composition | Canvas and Lupus upstream; Stir owns only contract/registration policy | Canvas is now maintained and decoupled-capable; duplicating its editor or storage would be wasteful |
| Lightweight listing framework and response contract | Stir optional capability | Repeated cross-project decoupled need that is not equivalent to one Drupal View |
| Bundle fields, filters, access/product rules, branded UI | Consumer project | These are domain-specific and should not expand the base platform |

This boundary avoids both extremes: projects do not integrate three upstream packages independently, and Stir does not fork or recreate maintained stacks. The Stir API remains stable even when an upstream package changes internally.

Illustrative consumer configuration:

```ts
export default defineNuxtConfig({
  extends: ['@stir/nuxt-theme', '@stir/nuxt-renderer'],
  modules: [
    ['@stir/nuxt', {
      features: {
        auth: false,
        editor: false,
        integrations: false,
        webform: true,
      },
    }],
  ],
})
```

The current all-in-one experience remains available through `@stir/nuxt-preset`.

## Reuse-first implementation rules

vNext should follow a deliberate reuse hierarchy: browser and web-platform primitives, Vue and Nuxt primitives, Nuxt UI, Tailwind CSS, VueUse, then well-maintained ecosystem modules. Custom implementation is the last choice and should normally exist only for Stir's Drupal-specific behavior or a documented gap in those tools.

- **Nuxt owns application behavior:** prefer Nuxt routing, layouts, middleware, plugins, runtime config, server handlers, data fetching, error handling, SEO, image, scripts, and lazy hydration mechanisms over parallel abstractions.
- **Nuxt UI owns interface behavior:** use its accessible components, semantic tokens, variants, slots, form primitives, overlays, navigation patterns, and theme configuration rather than maintaining Stir versions of the same controls.
- **Tailwind owns routine styling:** keep styling close to components, use semantic design tokens, and extract repeated patterns intentionally. Avoid both large bespoke stylesheets and a second class-configuration system that merely recreates Tailwind or Nuxt UI.
- **VueUse owns proven browser composables:** use its tree-shakeable utilities for event listeners, media queries, observers, storage, focus, visibility, and similar concerns when they remove real lifecycle and edge-case code. Do not wrap a Nuxt primitive or a trivial platform API merely to say VueUse is present.
- **Community packages must earn their place:** prefer maintained, SSR-compatible modules with a clear performance and ownership advantage. Do not keep two libraries that solve the same problem.
- **Custom code must state why it exists:** new abstractions should identify the missing platform capability, Drupal-specific contract, or measurable benefit they provide. Small adapters are preferable to copied or forked implementations.
- **Server-first is the default:** render and transform on the server where appropriate, minimize client plugins and global reactive state, and hydrate interactive components only when needed.

This is a reuse policy, not a dependency-maximization policy. The fastest and smallest solution may be a native platform or Nuxt primitive; the objective is to avoid recreating mature behavior while keeping the shipped dependency graph lean.

## Drupal 11/12-first implementation rules

Stir Tools should receive the same architectural care as Nuxt. Its reuse hierarchy is Drupal core APIs and extension points, existing maintained contrib capabilities, Symfony/PHP primitives already provided by Drupal, then custom Stir code only for a real decoupled or editorial requirement.

- **Target Drupal 11+:** Drupal 11 is the minimum vNext baseline; Drupal 10 constraints, branches, and compatibility shims are removed. VNext becomes Drupal 12-compatible only when its full suite passes against a Drupal 12 release. Track Drupal 11 deprecations continuously so the major upgrade is routine rather than a dedicated rescue project. Drupal's [continuous-upgrade policy](https://www.drupal.org/about/core/policies/core-change-policies/continuous-upgrades-between-major-versions) explicitly encourages maintainers to keep up with deprecations.
- **Use stable Drupal APIs:** prefer entity, configuration, state, typed-data, file, queue, batch, lock, cache, language, access, routing, plugin, event, and HTTP-client APIs. Do not bind Stir Tools to Drupal internal classes, core table schemas, or incidental implementation details; Drupal's [backend compatibility policy](https://www.drupal.org/about/core/policies/core-change-policies/bc-policy) identifies those as unsafe extension contracts.
- **Dependency injection by default:** inject narrow interfaces into services, plugins, controllers, and forms; keep `\Drupal::*` access in procedural hooks/update functions where container injection is not practical. Prefer explicit, predictable service definitions and tagged extension points over service-location or custom registries, consistent with Drupal's [service and dependency-injection guidance](https://www.drupal.org/docs/drupal-apis/services-and-dependency-injection/services-and-dependency-injection-in-drupal).
- **Thin framework entry points:** hooks, controllers, forms, event subscribers, queue workers, and plugins should coordinate access/input/output and delegate business policy. Pure normalization and decision logic should remain fast to unit test without booting Drupal.
- **Avoid abstraction inflation:** keep focused services when they isolate a real policy or reusable capability, but collapse pass-through facades, constructor-only wrappers, duplicate adapters, and helpers that merely rename a Drupal API. Measure cohesion and dependency fan-in/fan-out, not a target file length.
- **Small, self-contained modules:** each optional feature owns its services, routes, configuration, permissions, tests, and dependencies. The minimal CE core must not know about Webform, Gin, Bunny, Instagram, account UI, or provider-specific workflows. Deprecated/empty modules receive a documented removal path instead of permanent maintenance.
- **Cacheability is part of every response contract:** bubble entity/config/access dependencies through cache tags, vary through the narrowest correct contexts, and use max-age only for genuine time dependence. Prefer permanent cacheability plus precise invalidation. Drupal documents tags, contexts, and max-age as the three parts of [cacheability metadata](https://www.drupal.org/docs/8/api/cache-api/cache-api).
- **Optimize measured hot paths:** establish query count, entity-load count, external-request count, wall-time, memory, response bytes, and cache-hit baselines. Use bounded entity queries, bulk loads/writes, queues/batches for slow provider work, explicit timeouts, and no entity loading inside loops when a bulk operation is possible.
- **Produce lean frontend contracts:** Drupal sends content semantics, access-filtered data, image candidates/sizes, and cache metadata—not frontend implementation internals or unused entity detail. Summary/detail payload modes, app-context composition, and list/view payloads get independent size budgets.
- **Security remains Drupal-native:** route/entity access, permissions, CSRF, validation, sanitization, private/no-store responses, Flood/lock APIs, and secret/config separation remain authoritative in Drupal. Nuxt may provide defense-in-depth and early UX validation but must not become the only enforcement point.
- **Configuration and data changes are deployable:** every schema/config/entity change includes schema updates, update or post-update paths, idempotency, rollback/risk notes, and existing-site tests. No content rewrite is hidden inside a cache rebuild or ordinary request.
- **Public APIs are intentional:** document supported services, events, plugins, routes, payload keys, and extension points; mark implementation details internal. Public changes follow a tested deprecation window rather than leaving compatibility branches indefinitely. Drupal's current [deprecation guidance](https://www.drupal.org/about/core/policies/core-change-policies/how-to-deprecate) requires clear replacement/removal information and coverage for meaningful compatibility logic.
- **Quality gates match risk:** require PHPCS, PHPStan, deprecation scans, Composer audit, unit tests, targeted kernel/browser tests, configuration-schema validation, clean install/update testing, and decoupled endpoint contract tests. Network-backed features also require timeout, malformed-response, permission, and unavailable-provider cases.

The desired result is not merely Drupal 12 syntax compatibility. It is a smaller module graph, clear public contracts, predictable cache behavior, fewer queries and provider calls, safe upgrade paths, and code that another Drupal developer can change without learning the history of the whole platform.

## Optimization and reduction acceptance criteria

The redesign is not complete merely because the folders look cleaner. It should be accepted only when it produces measurable reductions without breaking the four consumers.

- **Less code per application:** a minimal site must not enable Drupal Webform/account/admin/provider integrations or register Nuxt auth routes, Tiptap editing, analytics, UserWay, popup/privacy, or Webform code unless selected.
- **Less global surface:** reduce the approximately 374 auto-scanned exports to a documented, prefixed public allowlist. Internal helpers should be explicit imports and invisible to consumers.
- **Less configuration:** replace internal DOM/Tailwind class maps with semantic variants and a much smaller stable configuration contract. Nuxt UI configuration remains the primary styling mechanism.
- **Less duplication:** remove deprecated listing helpers, the unused core protected-access implementation, cross-layer wrapper duplication where compatibility no longer requires it, and repeated parsing/normalization policy.
- **Less Drupal maintenance surface:** retire confirmed-unused compatibility modules, collapse pass-through services, remove unsupported Drupal 10 branches from vNext, and keep each remaining service because it owns a clear policy or extension point.
- **Less published tooling:** consumer config must contain no repository-only diagnostics, report writers, lint setup, or analysis dependencies.
- **Less dependency cost:** auth, editor, Webform, analytics, accessibility testing, and performance tooling must live in the correct optional or development package rather than the default production dependency graph. On Drupal, layout/CE core must not require Gin, login switching, Webform, Bunny, or other bridges that are not enabled.
- **Executable contract parity:** every published producer fixture must validate against its schema and pass the corresponding Nuxt parser/adapter/component contract test. Handwritten TypeScript cannot silently omit backend states such as account approval or Webform redirects.
- **Standard fields work by configuration:** enabling a supported field in a decoupled view mode produces its documented prop/slot shape, generated TypeScript contract, and accessible generic Nuxt rendering without consumer PHP or Vue. Unknown field types and Custom Elements fail visibly in development/CI rather than disappearing.
- **Native nested layouts:** Layout Paragraphs output is produced as ordered nested region slots with access and cache metadata intact. Multi-level, orphaned, invalid-region, empty, unpublished, access-denied, and translated cases are contract-tested; Nuxt never reconstructs the tree from transport metadata.
- **Source-independent composition:** the same component contract fixture can be produced by a direct field display, Layout Paragraphs, or the Canvas pilot and rendered by the same Nuxt component without source-specific branches. Ordinary entity properties do not require Paragraph wrappers, and independently reusable/listable content is not trapped in host-owned Paragraphs.
- **Governed visual composition:** Canvas is not exposed to clients until role-based component visibility, server-enforced slot/cardinality rules, protected global regions/templates/theme assets, revisions/moderation, and source-controlled component delivery all pass with stable supported code. Client roles can edit bounded semantic choices but cannot author JSX, CSS, Tailwind classes, components, templates, or the site-wide design system.
- **Deliberate listing paths:** embedded Views use lightweight row displays and bounded rendering; SSR-critical/faceted catalogues use typed ID-first listing endpoints. Representative routes have cold/warm query-time, query-count, entity-load, response-byte, cacheability, and total-latency budgets.
- **Listings are discoverable:** every listing is registered as either a real View-backed provider or a code-backed provider and appears in one Drupal administration inventory with its endpoint, schema version, filters/sorts, summary mode, cache policy, and performance status. “View” is reserved for actual Views configuration.
- **No upstream-internal coupling:** the Stir facade is the only consumer-facing dependency on Lupus/CE/Nuxt CE behavior. Proxy replacement, render transforms, and diagnostics use supported hooks or isolated compatibility adapters covered by integration tests—not path-string matching in consumer config.
- **Verified Drupal readiness:** supported Drupal 11 minors must pass clean install, update, PHPCS, PHPStan, deprecation, unit, kernel/browser, and contract gates. Drupal 12 is added to the declared range only after the same relevant gates pass against an actual release.
- **No unstable Drupal coupling:** production code should have no unexplained dependency on `@internal` APIs, direct core-table schemas, deprecated services, or global service location inside injectable classes.
- **A semantic presentation contract:** no new CMS fields or APIs should store completed Tailwind class recipes when a constrained semantic value can represent the same choice. Legacy class compatibility remains isolated and measured until content is migrated.
- **A project-specific Tailwind manifest:** every production build records a validated Drupal presentation-manifest version/hash and generates literal Tailwind 4 sources from its used semantic values plus an explicit safety reserve. Track manifest item count, generated utility count, compiled CSS bytes, invalid tokens, and build-trigger latency before and after replacing the blanket safelist.
- **Smaller backend payloads:** establish budgets for representative CE page, view, media-summary, app-context, and auth-config responses. Teasers and list rows must not include detail media or repeated shell data without evidence that it improves end-to-end latency.
- **Measured Drupal performance:** set route-specific budgets for database queries, entity loads, external requests, memory, wall time, and cacheability. Performance work must improve a measured hot path or remove demonstrable complexity.
- **No full-preset regression:** the compatibility preset should meet or improve the refreshed 191.27 kB gzip initial-client baseline and existing route-level Lighthouse medians.
- **A materially smaller minimal preset:** establish separate JavaScript, CSS, Nitro-output, route-count, plugin-count, middleware-count, frontend dependency-count, enabled Drupal module-count, backend dependency-count, payload-size, and build-time budgets for the minimal configuration. Set final numeric targets after measuring the real consumer feature matrix.
- **Safer CSS reduction:** reduce global CSS and the Drupal safelist only from captured production payload evidence; never delete CMS-driven utilities because local source scanning cannot see them.
- **Cleaner execution:** zero Nuxt initialization errors during tests, a successful deterministic homepage SSR/hydration check, and successful packed builds for minimal and full consumers.
- **Faster maintenance:** changes to auth, Webforms, Drupal proxying, theme, or integrations should normally affect one capability package and its contract tests rather than the root platform config.

Compatibility adapters may temporarily increase total repository code while both generations coexist. The final measures are the code and dependencies each consumer receives, the size of the supported public API, duplicated logic removed, and the complexity of making a safe change—not raw line count alone.

## Delivery guardrails

These are safeguards for the rebuild, not additional platform features:

- **Keep explicit non-goals:** vNext does not replace Lupus, Custom Elements, Nuxt UI, VueUse, Layout Paragraphs, or Drupal Views where they already fit; it does not absorb DancePlug/RSF business rules; and it does not migrate existing content merely to make the implementation look newer.
- **Maintain a golden reference consumer:** one deliberately small Drupal 11 + Nuxt 4 project must install the published packages from scratch and demonstrate direct fields, media, a nested Layout Paragraphs page, an embedded View, a lightweight listing, cache invalidation, and one optional capability. Its source, fixtures, screenshots, budgets, and setup instructions become executable documentation and a release gate.
- **Require editor acceptance, not only technical tests:** a representative client editor must be able to create, revise, preview, publish, translate, reorder, and recover a realistic page in Gin without touching Tailwind classes, machine names, JSON, or developer configuration. Record task time, confusing steps, permission failures, and regressions against the current workflow.
- **Rehearse migration and rollback:** the pilot consumer must have a documented cutover, content/config update path, cache/deployment sequence, compatibility window, monitoring checks, and tested rollback to the current production line. Do not migrate the next consumer until that rehearsal succeeds.

## Migration strategy

1. **Freeze reality, not assumptions.** Inventory frontend imports/overrides/config, enabled Drupal modules, endpoint usage, payload variants, CE displays/force-auto modes, Paragraph bundle purposes, Layout Paragraphs nesting, embedded Views, optimized listing endpoints, stored class values, and feature combinations across all active consumers. Classify every Stir Tools module and public service as keep, simplify, split, merge, deprecate, or remove.
2. **Repair known current-generation drift.** Handle account approval correctly, align the Webform type/redirect behavior, replace the invalid sanitized Webform fixture, and add regression tests before treating current output as the reference.
3. **Create the executable contract.** Export producer-owned schemas and sanitized fixtures for CE pages, source-independent components, standard fields, nested layouts, embedded Views, lightweight listings, media summary/detail, app context, Webforms, auth/account, SEO, sitemap, and error responses.
4. **Build both vNext paths beside production.** Do not reorganize either production package in place.
5. **Establish the Drupal compatibility gate.** Make the vNext baseline clean on supported Drupal 11 minors and PHP versions, remove Drupal 10 declarations and code paths, track core/contrib deprecations, and add Drupal 12 prerelease CI when installable.
6. **Slim Drupal capabilities first.** Separate layout/CE core from the Layout Paragraphs bridge, lightweight listing toolkit, Webform, admin theme, login, Bunny, Instagram, and other optional bridges while preserving a full compatibility preset.
7. **Add the presentation-usage manifest.** Export used semantic values and validated legacy utilities, generate the corresponding Tailwind 4 source during Nuxt builds, and connect manifest revision changes to the deployment webhook. Keep the compatibility safelist until CSS-size and missing-utility checks prove the replacement safe.
8. **Port pure frontend logic.** Move normalization, validation, routing policy, and security policy into `@stir/nuxt-shared` with existing tests, using generated/validated contract types at the boundary.
9. **Port paired capabilities.** Drupal runtime/CE core, standard field renderer, direct Layout Paragraphs bridge, embedded Views, lightweight listings, neutral theme/renderer, Webforms, auth, editor, SEO/sitemap, and integrations. A capability is complete only when both producer and consumer contract tests pass.
10. **Provide compatibility adapters.** Keep old endpoints, payload aliases, Tailwind class strings, and `~/...` imports temporarily, with migration warnings or telemetry where feasible.
11. **Test a cross-platform matrix.** Minimal Drupal + minimal Nuxt, full compatibility pair, auth pair, Webform pair, editor pair, override-heavy app, packed install, and the real consumers.
12. **Pilot the least customized consumer.** Compare enabled modules, routes, queries, payload bytes, compiled CSS, HTML, screenshots, accessibility, Lighthouse medians, manifest rebuild timing, and cache behavior before broader adoption.

## Recommended order of work

1. Freeze the current green `dev` baseline, record its quality/consumer-build and performance results, and move repository-only diagnostics out of published config when the vNext workspace boundary is introduced.
2. Fix the account-approval and Webform contract gaps and replace the non-representative Drupal fixture.
3. Correct or explicitly document Nuxt environment/runtime semantics.
4. Make the Nuxt test harness fail on initialization errors and assert a deterministic homepage.
5. Change Stir Tools vNext metadata and dependency constraints to Drupal 11+, remove Drupal 10 compatibility paths, run a module-by-module deprecation/internal-API audit, and define the Drupal 12 prerelease matrix.
6. Generate the actual frontend public API/override inventory and the Drupal module/service/endpoint/payload inventory from real consumers.
7. Capture RSF/DancePlug field, nested-layout, embedded-View, optimized-listing, and project-override fixtures as the behavioral baseline.
8. Write cross-repository architecture decisions for upstream/Stir/project ownership, capability boundaries, Drupal extension points, field contracts, listing paths, semantic presentation values, compatibility, and versioning.
9. Add the producer-owned contract artifact and make both CI pipelines validate it.
10. Build the decoupled field registry/default renderer and direct Layout Paragraphs CE bridge, with migration adapters for current force-auto and flat-layout responses.
11. Extract the current lightweight-listing helper into an optional `stir_listing` contract/toolkit; implement and benchmark both a Views-query provider and one DancePlug code provider without moving DancePlug field/query policy into Stir Tools.
12. As a separate research task, build one small representative landing page with the same component manifest in Layout Paragraphs and Canvas/Lupus; test developer, client-editor, reviewer, and anonymous roles and record governance, authoring, workflow, translation, preview, performance, cacheability, payload, Nuxt, and migration results before considering any change from the Layout Paragraphs default.
13. Implement the Drupal presentation-usage manifest and Nuxt Tailwind 4 source generator, with schema validation, deterministic hashes, strict failure behavior, and rebuild signalling.
14. Extract a minimal Drupal layout/CE core and optional bridges behind the existing compatibility install path, measuring module count, queries, payloads, and cacheability before/after.
15. Scaffold the Nuxt vNext workspace and port the Drupal adapter, standard renderer, and one embedded-View plus lightweight-listing path against the executable contract.
16. Propose generic secure-proxy and unresolved-component hooks upstream; keep tested compatibility adapters until released support is available.
17. Add full compatibility presets on both sides, then migrate one consumer.

## Bottom line

The existing repositories are not failures that need replacing. Together they form a successful decoupled platform whose product and contract boundaries have not kept pace with its capabilities. Rebuilding those boundaries in parallel should produce a smaller Drupal installation, smaller Nuxt application, clearer ownership, and safer independent releases without sacrificing the behavior both repositories have earned.
