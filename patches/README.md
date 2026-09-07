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


# Drupal CE 2.9.0 page-commit fix

`nuxtjs-drupal-ce@2.9.0.patch` carries the navigation-state changes from
[PR #538](https://github.com/drunomics/nuxtjs-drupal-ce/pull/538), reviewed commit
`b2673397288d0a91b9b523ac17a6e1121285a5f6`. Only the affected runtime composable
is patched. The normal upstream package remains the dependency; no fork is used.

Shared `getPage()` retains the outgoing page until Nuxt completes the destination.
Page-local components must use their returned `fetchPage()` ref. Existing route
snapshots remain in place. This patch does not change CDN keys or claim a speed gain.

Like the Vite patch, consumers must opt in at the application root. Copy the patch
into `patches/` and merge this entry into `pnpm-workspace.yaml`:

```yaml
patchedDependencies:
  nuxtjs-drupal-ce@2.9.0: patches/nuxtjs-drupal-ce@2.9.0.patch
```

Keep the application on exactly `nuxtjs-drupal-ce` 2.9.0 while using this patch;
install and commit the lockfile, then rebuild and test client navigation. This
layer's patch does not automatically propagate into consumer applications.
Remove the entry and patch after adopting an upstream release with the fix.
Do not apply it to another version without review. Deployment to Stir or DancePlug
must be validated separately; availability in this layer is not site deployment.
