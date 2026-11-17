# Performance measurements and budgets

Keep the existing budget values visible without treating every historical overrun as a release blocker. The current reviewed build has about **234.25kB gzip in its initial static graph**, versus **234.22kB** for revision `899ca16010a0f892d7adb275da0f89c998b584a0` rebuilt with matching configuration, dependencies and corrected analysis instrumentation. This is effectively unchanged. The earlier 235.59kB figure used different accounting and does not demonstrate an improvement.

The exclusive editor static graph is approximately **304.52kB gzip**; its largest individual chunk is approximately **174.38kB**. These describe different things. The editor remains outside the anonymous initial static graph. Browser navigation and editor activation can load additional assets, so the initial graph is not a complete page-transfer measurement.

## What CI enforces

The core production build runs with `STIR_PERF_ANALYZE=true`. Each build owns its analysis under its own root; consumer builds must not overwrite the package workspace's analysis. The report verifies that analyzed JavaScript exists in the matching output, allowing Vite's removed empty CSS-only JavaScript facades.

`pnpm perf:report --no-build --warn-budget` reuses the analyzed output. It fails when analysis/output mismatch, the app entry is missing, or Tiptap/ProseMirror enters the initial static graph. Packed consumers separately fail if excluded capabilities enter minimal output or full capabilities disappear.

The existing 229kB initial, 192.5kB initial-JS and 170kB largest-editor thresholds currently warn. They have not been raised. CSS and motion limits remain unchanged. Investigate future growth using the report's largest assets and editor graph; do not confuse a chunk cap with total feature cost.

## How to measure

Measure the page as production serves it, or the numbers mislead.

1. **Deployed site (preferred).** `pnpm audit:perf` in the site, with
   `PAGESPEED_API_KEY` set, runs Google PageSpeed Insights against the deployed
   URL: the same engine as pagespeed.web.dev, on the real server, CDN, HTTP/2
   and compression. Use staging for before/after comparisons.
2. **Local production build.** `pnpm perf:lighthouse:local` builds, starts the
   preview server and measures it through an HTTP/2 front that gzips HTML.
   The Node preview server alone speaks HTTP/1.1 without HTML compression;
   Lighthouse's simulated throttling models HTTP/1.1 as six connections per
   host, so a hydrated page's ~150 module requests queue up and LCP is
   inflated. On one client home page the same build measured score 74 /
   LCP 7.6 s direct and score 88 / LCP 3.9 s through the front. Results from
   before November 2026 were taken direct and are not comparable.

Under HTTP/2, JavaScript costs roughly 5 ms of simulated mobile LCP per KB
transferred. Merging chunks to cut requests made LCP worse (more bytes
before the hero paints).

## Runtime evidence

Use at least three mobile production Lighthouse runs per variant with representative Drupal content, the same dependencies and comparable caches. Report score, FCP, LCP, TBT, CLS, transfer, media and video requests. Run CPU-heavy builds/tests separately. Record the throttling method; simulated estimates and actual browser throttling are not interchangeable.

The September review found essentially unchanged transfer sizes and highly variable simulated timings. A follow-up Stir comparison with actual browser throttling measured median LCP 1.92s before and 1.95s after, with similar TBT and identical CLS. This supports a reliability/accessibility change with broadly unchanged loading under that test, not a speed-improvement claim. It does not replace production hosting or field measurements.

An isolated preload/prefetch experiment increased requests, but timing-model variability prevents a strong causal performance claim. Keep the current defaults: no reliable benefit from changing them was established. An October 2026 recheck on a client site's production build (three mobile devtools-throttled runs per route, home and two content pages) found the same: restoring modulepreload links moved the score medians in both directions (70→76, 92→80, 90→88), and inlining the entry CSS (`features.inlineStyles` with vitalizer `disableStylesheets: 'entry'`) added about 270 KB of uncacheable HTML per page with no consistent gain. Verify future policy changes on deployed staging and include navigation readiness, not only a cold-load score.

Before rollout, check a real authenticated editor session separately from anonymous loading. Bundle isolation is verified; this review does not establish authenticated editor timing or whole-site Core Web Vitals.
