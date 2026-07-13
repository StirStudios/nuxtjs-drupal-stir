# Layer Alias And Typecheck Notes

This layer intentionally keeps both Nuxt `alias` entries and `tsconfig.json`
`paths` overrides for its established public app imports.

## Why both exist

- `nuxt.config.ts` `alias` controls Nuxt/Vite runtime and generated type aliasing.
- `tsconfig.json` `paths` ensures `nuxi typecheck` resolves the same aliases in CI and local runs.

Without these, layered imports such as `~/utils`, `~/composables`,
`~/components`, `~/types`, `#app`, and `#components` can fail under strict pnpm
resolution in CI.

## Import convention

- Use `~/types` for shared webform and component data shapes.
- Use the existing `~/composables/*`, `~/utils/*`, and `~/components/*` paths
  when a downstream override needs a public layer implementation.
- Avoid relative imports that reach into `layers/theme` internals.

These aliases are a published downstream contract used by current projects.
Changing them requires a coordinated major migration across consumers rather
than a compatibility shim in the base layer.

## Consumer-app smoke check

CI includes a minimal consumer app fixture at `tests/fixtures/consumer-app`
that extends this layer and runs:

- `nuxi typecheck`
- `nuxi build`

This guards against regressions that only appear when the layer is consumed
from a root app.
