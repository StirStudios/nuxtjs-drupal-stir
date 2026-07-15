# Layer architecture review — July 2026

## Decision

Keep the existing three-layer architecture and improve it incrementally. A full
rebuild is not justified by the measured bundle or by the current compatibility
risk across four active consumers.

The layer boundaries remain useful:

- `core` owns Drupal CE proxy and server integration.
- `theme` owns reusable rendering and presentation.
- `auth` owns authentication and protected-page behavior.

## Evidence

- The production build completes at 9.96 MB (2.68 MB gzip) of Nitro output,
  compared with approximately 10.10 MB (2.69 MB gzip) before the review.
- Initial static client assets are 196.65 kB gzip: 161.56 kB JavaScript and
  35.09 kB CSS. The prior measurement was approximately 196.06 kB gzip:
  160.99 kB JavaScript and 35.07 kB CSS. This 0.59 kB increase is effectively
  flat and should not be presented as a performance improvement.
- The rich-text editor remains deferred and decreased from approximately
  169.73 kB to 167.29 kB gzip. It is not part of the anonymous initial bundle.
- Reveal motion remains async and decreased from approximately 27.80 kB to
  26.89 kB gzip; static paragraph text now skips its renderer entirely.
- La Amada, Piper, DancePlug, and Stir were inventoried read-only at pinned Git
  revisions. All consume the GitHub layer contract.
- A packed tarball now resolves through `package.json` and successfully
  typechecks and builds as `@stir/base` in an isolated temporary consumer.

The machine-readable figures are in `docs/perf-report.latest.json`; the public
compatibility surface is recorded in `docs/public-contracts.json`.

## Changes made during the review

- Added coverage and compatibility ratchets, sanitized Drupal payload fixtures,
  public endpoint smoke tests, and isolated consumer packaging tests.
- Extracted environment and sitemap policy from the root Nuxt configuration.
- Extracted persisted Drupal view state into a small tested utility while
  preserving the composable's exported types.
- Replaced video subscriber polling with explicit iframe registration, retaining
  DOM scanning as a compatibility fallback.
- Avoided loading reveal-motion rendering for static paragraph text.
- Consolidated direct Tiptap packages on one version and moved browser-only test
  tooling out of production dependencies.
- Stopped imposing the development-only Nuxt ESLint module on consumers and
  declared Nuxt Scripts as a runtime dependency.

## Next optimization targets

The largest opportunity is the 161.56 kB gzip app entry. Before splitting it,
use route-level Lighthouse medians against representative Drupal payloads to
identify execution cost, not just transfer size. The 35.09 kB CSS entry and
generated Drupal utility safelist should be reduced only after real consumer
payload usage is captured; removing classes based solely on local source scans
would break CMS-driven layouts.

Header/footer decomposition and further view-control extraction are worthwhile
maintainability work, but should remain behavior-preserving changes backed by
the new consumer and contract gates. They do not require a framework or layer
rewrite.
