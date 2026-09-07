# Vite 8.2.2 preload bookkeeping fix

This temporary pnpm patch removes empty entries before Vite creates promises for preload dependencies. JavaScript preload links and already-seen dependencies return `undefined`; only pending CSS loads need settling. All preload links, CSS readiness, rejection events and CSP nonce behavior remain intact.

The corresponding source fix was tested against the Vite `v8.2.2` tag. A regression test fails on the original helper and passes with the fix. Validation included 939 passing unit tests and 47 passing selected build-browser tests covering preloading, CSS splitting/imports, CSP and import maps (3 unit and 5 browser tests skipped).

On a representative Stir production homepage, three interleaved mobile Lighthouse runs of fresh source builds measured median TBT 607 → 453 ms, with LCP 2.04 → 1.99 seconds. This is a local lab result, not a guarantee for every consumer or a field INP measurement.

## Consumer installation

Package-manager patches belong to the application root; extending this layer does **not** apply them automatically. For an application using Vite 8.2.2:

1. Copy `vite@8.2.2.patch` from this directory to the application's `patches/` directory.
2. Merge this entry into its root `pnpm-workspace.yaml`:

```yaml
patchedDependencies:
  vite@8.2.2: patches/vite@8.2.2.patch
```

3. Run `pnpm install`, commit the patch, configuration and updated lockfile together, and rebuild. Verify that the Vite resolved by `@nuxt/vite-builder` is the patched version.
4. Test a production build, including first interaction with lazy components and route navigation.

Do not disable module preloading or modify generated application assets. Do not copy this patch to a different Vite version without reviewing its source and rerunning the regression checks.

## Upstream status

On September 6, 2026, npm listed 8.2.2 as latest stable and Vite main still contained the same empty promise work. Searches found no equivalent fix. Related [PR #19805](https://github.com/vitejs/vite/pull/19805) provides browser compatibility, while [PR #19722](https://github.com/vitejs/vite/pull/19722) and [PR #19757](https://github.com/vitejs/vite/pull/19757) address different preload concerns. Recheck upstream before carrying the patch forward.

## Removal

Remove the entry and patch, reinstall and rebuild once an upstream Vite release includes an equivalent fix. Recheck CSS loading/error behavior and production timings. Upstream source fix and regression test: [vitejs/vite#23446](https://github.com/vitejs/vite/pull/23446). Track its resolution and release before removing this patch.
