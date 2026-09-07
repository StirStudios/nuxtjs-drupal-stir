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

## Drupal CE runtime dependency repair

CE 2.9.0 imports `h3` without declaring it. A consumer that also installs H3 2
can resolve that unrelated version, causing response-header forwarding to fail
during SSR because Nuxt 4's Nitro server supplies H3 1 events.

Until CE declares its own compatible dependency, merge this into each application's
root `pnpm-workspace.yaml`, alongside the patches above:

```yaml
packageExtensions:
  nuxtjs-drupal-ce@2.9.0:
    dependencies:
      h3: ^1.15.11
```

Run `pnpm install`, commit the workspace configuration and lockfile together, and
rebuild. This scoped manifest repair uses pnpm's supported `packageExtensions`;
it does not globally override H3 2 needed by other packages. Like patches, it is
not inherited by applications extending the layer. Remove it when upgrading to
a CE release that declares the compatible runtime dependency.

Upstream fix: [drunomics/nuxtjs-drupal-ce#541](https://github.com/drunomics/nuxtjs-drupal-ce/pull/541).

# Vue 3.5.42 async SSR context repair

The paired `@vue/runtime-core` and `@vue/server-renderer` patches clear a sibling's
restored async setup instance before the server renderer enters a render subtree.
Without this, valid slot calls inside render functions can produce false
"Slot invoked outside of the render function" warnings. The minimal reproduction
contains only Vue; no Stir, Drupal, Nuxt UI, or scrolling behavior is required.

The source fix passed 1,385 Vue runtime/server-renderer tests, including a new
regression that fails on the unmodified v3.5.42 release. These temporary patches
cover the Node CJS development/production and ESM bundler distributions used by
Nuxt; standalone browser SSR bundles are outside this integration's scope.

Apply both together at the app root:

```yaml
patchedDependencies:
  '@vue/runtime-core@3.5.42': patches/@vue__runtime-core@3.5.42.patch
  '@vue/server-renderer@3.5.42': patches/@vue__server-renderer@3.5.42.patch
```

Reinstall and restart the dev server. Run `node patches/vue-ssr-context-repro.mjs`
in this layer to verify the installed package behavior. This is a rendering
correctness fix, not a measured performance claim. Do not suppress Vue warnings.
Remove both repairs after adopting an upstream release with the equivalent fix;
do not apply these files to other versions without source review and tests.
