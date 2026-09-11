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
