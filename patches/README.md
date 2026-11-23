# Drupal CE runtime dependency repair

CE 2.9.0 imports `h3` without declaring it. A consumer that also installs H3 2
can resolve that unrelated version, causing response-header forwarding to fail
during SSR because Nuxt 4's Nitro server supplies H3 1 events.

Until CE declares its own compatible dependency, merge this into each application's
root `pnpm-workspace.yaml`:

```yaml
packageExtensions:
  nuxtjs-drupal-ce@2.9.0:
    dependencies:
      h3: ^1.15.11
```

Run `pnpm install`, commit the workspace configuration and lockfile together, and
rebuild. This scoped manifest repair uses pnpm's supported `packageExtensions`;
it does not globally override H3 2 needed by other packages. It is
not inherited by applications extending the layer. Remove it when the layer drops `nuxtjs-drupal-ce`
(docs/plans/own-drupal-ce.md, Phase 2c).

Upstream fix: [drunomics/nuxtjs-drupal-ce#541](https://github.com/drunomics/nuxtjs-drupal-ce/pull/541).
