# Layer Alias And Typecheck Notes

This layer intentionally keeps both Nuxt `alias` entries and `tsconfig.json` `paths` overrides.

## Why both exist

- `nuxt.config.ts` `alias` controls Nuxt/Vite runtime and generated type aliasing.
- `tsconfig.json` `paths` ensures `nuxi typecheck` resolves the same aliases in CI and local runs.

Without these, layered imports such as `~/utils`, `~/composables`, `~/components`, `~/types`, `#app`, and `#components` can fail under strict pnpm resolution in CI.

## Import convention

- Use `~/types` for shared webform/form types.
- Avoid relative type imports such as `../../../types` in layer files.

## Consumer-app smoke check

CI includes a minimal consumer app fixture at `tests/fixtures/consumer-app` that extends this layer and runs:

- `nuxi typecheck`
- `nuxi build`

This guards against regressions that only appear when the layer is consumed from a root app.
