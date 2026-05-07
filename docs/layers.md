# Layers Guide

This repository is structured into three Nuxt layers with clear ownership:

- `layers/core`: server/runtime integration concerns (Drupal API proxy utilities, secure API middleware, shared backend endpoints).
- `layers/theme`: UI/theming concerns (components, layouts, styles, app-facing composables, UI helpers).
- `layers/auth`: authentication and account flows (auth pages, auth/account composables, auth/account API routes, auth middleware).

## Ownership Rules

- Put code in the layer that owns the behavior.
- Keep layer-internal logic inside that layer.
- Keep root-level config focused on orchestration (`extends`, shared modules/runtime config).

## Type Placement

- Shared contracts used by multiple layers: keep at root `types/`.
- Layer-private types: keep in that layer (for example `layers/theme/app/types/*`, `layers/auth/app/types/*`).

## Override Guidance (Consuming Apps)

Common override order for downstream projects:

1. `app/app.config.ts`: UI tokens, labels, config-level behavior.
2. `app/assets/css/main.css`: brand/theme tokens and utility-level styling.
3. `app/components/*`: targeted UI component overrides.
4. Auth pages/composables only when authentication UX/policy differs.

## Boundary Guidelines

- Avoid importing internals from another layer's implementation folders.
- Prefer public/shared contracts (`~/types`) for cross-layer data shapes.
- Keep server concerns in `core`/`auth` server directories, not in `theme`.

## Notes

- Theme CSS is registered in `layers/theme/nuxt.config.ts` using a resolved file path. This is intentional for stable layer asset resolution.
