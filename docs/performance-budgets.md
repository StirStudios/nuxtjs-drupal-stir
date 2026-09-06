# Performance measurements and budgets

Keep the existing budget values visible without treating every historical overrun as a release blocker. The current reviewed build has about **234.25kB gzip in its initial static graph**, versus **234.22kB** for revision `899ca16010a0f892d7adb275da0f89c998b584a0` rebuilt with matching configuration, dependencies and corrected analysis instrumentation. This is effectively unchanged. The earlier 235.59kB figure used different accounting and does not demonstrate an improvement.

The exclusive editor static graph is approximately **304.52kB gzip**; its largest individual chunk is approximately **174.38kB**. These describe different things. The editor remains outside the anonymous initial static graph. Browser navigation and editor activation can load additional assets, so the initial graph is not a complete page-transfer measurement.

## What CI enforces

The core production build runs with `STIR_PERF_ANALYZE=true`. Each build owns its analysis under its own root; consumer builds must not overwrite the package workspace's analysis. The report verifies that analyzed JavaScript exists in the matching output, allowing Vite's removed empty CSS-only JavaScript facades.

`pnpm perf:report --no-build --warn-budget` reuses the analyzed output. It fails when analysis/output mismatch, the app entry is missing, or Tiptap/ProseMirror enters the initial static graph. Packed consumers separately fail if excluded capabilities enter minimal output or full capabilities disappear.

The existing 229kB initial, 192.5kB initial-JS and 170kB largest-editor thresholds currently warn. They have not been raised. CSS and motion limits remain unchanged. Investigate future growth using the report's largest assets and editor graph; do not confuse a chunk cap with total feature cost.

## Runtime evidence

Use at least three mobile production Lighthouse runs per variant with representative Drupal content, the same dependencies and comparable caches. Report score, FCP, LCP, TBT, CLS, transfer, media and video requests. Run CPU-heavy builds/tests separately. Record the throttling method; simulated estimates and actual browser throttling are not interchangeable.

The September review found essentially unchanged transfer sizes and highly variable simulated timings. A follow-up Stir comparison with actual browser throttling measured median LCP 1.92s before and 1.95s after, with similar TBT and identical CLS. This supports a reliability/accessibility change with broadly unchanged loading under that test, not a speed-improvement claim. It does not replace production hosting or field measurements.

An isolated preload/prefetch experiment increased requests, but timing-model variability prevents a strong causal performance claim. Keep the current defaults: no reliable benefit from changing them was established. Verify future policy changes on deployed staging and include navigation readiness, not only a cold-load score.

Before rollout, check a real authenticated editor session separately from anonymous loading. Bundle isolation is verified; this review does not establish authenticated editor timing or whole-site Core Web Vitals.
