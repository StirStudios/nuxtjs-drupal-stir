# vNext rebuild readiness report

Status date: 2026-07-16  
Nuxt checkpoint: `e17ca31f`

Nuxt integration checkpoint: `e17ca31f`
Stir Tools checkpoint: `7941fb2`

## Executive status

The structural rebuild is substantially complete and frozen for evidence-led
review. Minimal/full capability boundaries, producer-owned contracts, generic
field rendering, direct Layout Paragraphs trees, provider-neutral listings,
presentation usage, Valibot validation, Webform/auth privacy, editorial tools,
and downstream package ownership are implemented and verified. This is not yet
a release or migration approval.

The remaining readiness work is intentionally narrow:

1. decide and implement the shared carousel autoplay/accessibility policy;
2. run the approved live Bunny pull-CDN cache and recovery proof;
3. reconcile the dirty local RSF checkout with its newer remote `dev` branch;
4. move Piper from Drupal 10 to the required Drupal 11+ baseline;
5. rehearse one explicitly approved consumer cutover and rollback.

## Measured code-delivery result

| Production build | Initial gzip | Initial JavaScript | Initial CSS | Server output |
| --- | ---: | ---: | ---: | ---: |
| Full compatibility | 195.02 kB | 159.30 kB | 35.72 kB | 10.2 MB |
| Minimal | 157.43 kB | 122.97 kB | 34.46 kB | 5.73 MB |
| Reduction | 19.27% | 22.81% | 3.53% | about 44% |

The full preset is 1.96% above the original 191.27 kB compatibility baseline
after Nuxt UI 4.10 began embedding all 43 required UI icons for immediate SSR
and offline rendering. Existing consumers retain behavior and avoid runtime
Iconify requests, while new consumers can omit capabilities they do not need.

The validated strict presentation manifest also reduced the shared fixture CSS
15.70% gzip. DancePlug's project build reduced its main CSS 10.57% gzip in the
strict-manifest experiment, pending visual approval and adoption of the
`stir_decoupled` frontend theme.

## Production Lighthouse evidence

All included measurements are three-run mobile medians from production builds.
Development-server measurements are excluded.

| Consumer route | Score | FCP | LCP | TBT | Transfer | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| RSF `/contact` | 95 | 1.96 s | 2.72 s | 25 ms | 557 kB | Healthy Webform route |
| DancePlug class after deferred Bunny embed | 92 | 2.40 s | 2.93 s | 85 ms | 524 kB | Healthy class route |
| Piper `/venues` login | 89 | 1.97 s | 3.49 s | 64 ms | 413 kB | App-shell evidence only |
| DancePlug homepage | 71 | 3.45 s | 5.38 s | 71 ms | 1,001 kB | Wide local variance; public homepage still needs work |
| RSF homepage | 75 | 2.57 s | 5.77 s | 47 ms | 653 kB | Carousel policy blocks final LCP |

The DancePlug class correction is a representative downstream simplification:
removing an override that disabled the layer's click-to-load video default
raised the score from 72 to 92 and reduced initial transfer from 7.04 MB to
well below 1 MB. The final isolated median was 524 kB; initial Bunny video
requests fell to zero without removing playback.

DancePlug Nuxt Image testing verifies real IPX WebP variants, versioned source
keys, immutable generated-image caching, exact per-layout sizes, and normalized
Stir Tools image payloads. Tightening the decorative class-card contract and
migrating instructor avatars reduced measured homepage image waste from
185,645 to 36,741 bytes and a representative transfer from 1,001 to 912 kB.
Nuxt Image/IPX is now the layer default, with Drupal rendering retained as an
explicit migration fallback. An ordinary pull-CDN provider reuses Nuxt's IPX
URL contract, keeps the local `/_ipx` transformer available as Bunny's origin,
and derives the Drupal allowlist automatically from `DRUPAL_URL`. The final
production-build proof generated `https://danceplug-dev.b-cdn.net/_ipx` URLs
without Bunny Optimizer, storage, or a second Drupal pull zone. Live Bunny
MISS/HIT, first-hit, revision replacement, and purge recovery remain deployment
evidence rather than an architecture decision.

## Drupal performance and contract evidence

DancePlug's shared `classes` listing retained exact compatibility-payload
parity for default, second-page, created-order, and search requests. Each warm
run used seven queries and 24 entity loads. Total time ranged from 38.202 to
41.371 ms and payload size from 43,819 to 43,890 bytes, inside every configured
budget.

RSF's anonymous contact CE payload is 5,337 bytes with a public one-hour policy,
permanent Drupal render metadata, complete contexts, and invalidation tags for
the Webform, node, Paragraphs, CE displays, settings, and anonymous role. Every
Nuxt Webform submission response path now returns
`private, no-store, max-age=0`; the live invalid-submission path confirms the
header reaches the client.

The latest complete Stir Tools gate executes 924 tests and 6,659 assertions.
The final Nuxt integration checkpoint passed the repository's lint, type,
unit/runtime, SSR/hydration, accessibility, consumer, packed-consumer, and
production-build gates. The gate covered 359 unit/coverage tests, 97 Nuxt
runtime tests, protected-page end-to-end behavior, and four accessibility
profiles.

## Consumer findings

### RSF

- Desktop/mobile homepage, About, contact form, navigation, and images passed.
- Carousel and listing links failed locally because legacy project overrides
  stripped the normalized `url`. The shared layer now preserves it.
- Current remote RSF `dev` already uses the newer typed forwarding structure;
  the dirty local checkout is substantially behind and must be reconciled
  deliberately rather than force-pushed or silently merged.
- The homepage LCP is a carousel slide introduced by the automatic five-second
  advance. The image transfers quickly; Nuxt Image alone cannot correct a late
  content change.

### DancePlug

- Public homepage, authenticated dashboard, Drupal local tasks/edit links,
  class content, and Bunny playback passed functional review.
- Class video delivery now inherits the shared click-to-load default.
- The homepage LCP image is eager, high-priority, discoverable in initial HTML,
  and fast to transfer. Remaining local delay is dominated by Drupal SSR and
  render-blocking CSS rather than an image-priority defect.
- The image pilot now uses the upstream per-layout delivery-size contract and
  Stir Tools' provider-neutral file payload. Class-marquee cards and instructor
  avatars no longer recreate responsive-image delivery downstream.
- The final same-name component audit retained four deliberate product
  overrides: inline CTA markup, interactive Views presentation, editorial node
  variants, and public user profiles. The generic entity-reference override was
  removed after its fallback behavior moved upstream. DancePlug checkpoints
  `ae9ae0c` (Nuxt) and `27a59a6` (root) verify the resulting boundary and the
  CDN-ready default image delivery checkpoint.

### Piper

- Protected `/venues` login and application shell passed.
- Piper is an application-only consumer and its score is not averaged with
  public website routes.
- Its local backend is Drupal 10; migration to Drupal 11+ is a release gate.

## Decision gates

### Carousel policy

Recommended shared policy:

- autoplay disabled by default;
- explicit CMS opt-in only;
- opt-in autoplay includes a visible pause control;
- reduced-motion preference disables movement;
- interaction pauses or stops automatic movement.

This improves accessibility and prevents automatic slide changes from creating
late LCP candidates, but it changes visible behavior and therefore requires
approval before implementation.

### Nuxt Image production delivery

The provider decision and default switch are complete. Local IPX remains the
no-CDN path; an ordinary Bunny pull zone can cache the same public `/_ipx/**`
derivatives with Nuxt as its origin. Local production artifacts verify the
Bunny base URL, retained origin route, and automatic Drupal host allowlist.
Approval is still required before deployment, where first-hit and purge
recovery, cache keys, same-name revision replacement, visual quality, and
private-media behavior must be recorded. The Sharp-enabled DancePlug test
artifact remains 248 MB (106 MB gzip) and must be built for the deployment
architecture.

### Consumer cutover

No consumer cutover, merge, release, deployment, or content migration is
approved by this report. The first pilot must record exact revisions, config
changes, cache order, smoke/a11y/performance results, monitoring, and a tested
rollback path before another consumer moves.

## Readiness checklist

| Gate | Status | Evidence or remaining action |
| --- | --- | --- |
| Nuxt architecture/capability split | Passed | Minimal/full production builds and preset tests |
| Stir Tools capability ownership | Passed | Optional Views/Webform/Paragraph/provider boundaries |
| Producer-owned contracts | Passed | Versioned schemas, fixtures, producer and consumer validation |
| Bundle/code-reduction target | Passed | 19.27% initial gzip and about 44% server-output minimal reductions |
| Listing parity/performance | Passed | Four live DancePlug paths inside all budgets |
| Webform privacy/cacheability | Passed | Live render metadata and no-store submission response |
| Consumer functional review | Passed with migration note | RSF/DancePlug passed; Piper requires Drupal 11+ |
| Representative route Lighthouse | Passed with homepage exceptions | Class/Webform healthy; public homepages need final policy/provider work |
| Carousel accessibility/LCP policy | Decision required | Approve recommended default/opt-in behavior |
| Nuxt Image production provider | Implemented; staging proof pending | Default IPX and Bunny pull-CDN artifact passed; live cache/recovery requires approved deployment |
| RSF local/remote reconciliation | Pending merge authorization | Preserve dirty local work; use current remote architecture |
| Pilot migration and rollback | Not started | Requires explicit cutover approval |

The authoritative numeric artifact is
`docs/vnext/consumer-verification-2026-07.json`; bundle artifacts are
`docs/perf-report.latest.json` and `docs/perf-report.minimal.latest.json`.
