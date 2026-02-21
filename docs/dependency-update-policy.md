# Dependency Update Policy

Use this policy whenever running dependency updates in this layer.

## Standard update flow

1. Run range-safe updates first:

```bash
pnpm deps:update
```

2. Run the full verification gate:

```bash
pnpm deps:verify
```

3. Only merge if all checks pass.

## Preferred one-command flow

```bash
pnpm deps:update:safe
```

This runs:

- `pnpm update`
- `pnpm docs:sync-tech-stack`
- `pnpm verify:ci`

Where `pnpm verify:ci` runs:

- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

## Major-version upgrades

Avoid upgrading core tooling (for example `eslint`, `vue-tsc`, Nuxt-adjacent typing/tooling) in mixed update batches.

For major upgrades:

1. Create a dedicated PR.
2. Upgrade one major surface at a time.
3. Run the full gate.
4. Fix typing/linting regressions before continuing.

## Why

This keeps routine `pnpm update` changes low-risk while still allowing intentional upgrades with clear blast-radius control.
