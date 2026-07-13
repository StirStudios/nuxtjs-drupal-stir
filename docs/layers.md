# Layers Guide

This repository is structured into three Nuxt layers with clear ownership:

- `layers/core`: server/runtime integration concerns (Drupal API proxy utilities, secure API middleware, shared backend endpoints).
- `layers/theme`: UI/theming concerns (components, layouts, styles, app-facing composables, UI helpers).
- `layers/auth`: authentication and account flows (auth pages, auth/account composables, auth/account API routes, auth middleware).
- `server/utils`: shared Nitro utilities used by multiple layers when behavior must stay identical across boundaries.

## Ownership Rules

- Put code in the layer that owns the behavior.
- Keep layer-internal logic inside that layer.
- Keep root-level config focused on orchestration (`extends`, shared modules/runtime config).
- Put cross-layer server behavior in `server/utils` and keep layer-local files as stable wrappers when downstream imports may exist.

## Type Placement

- Webform/form contracts owned by the theme layer live in `layers/theme/app/types/*` and are imported through `~/types`.
- Layer-private types stay in that layer (for example `layers/theme/app/types/*`, `layers/auth/app/types/*`).
- Cross-layer server contracts should live near the shared server utility or endpoint that owns them.

## Override Guidance (Consuming Apps)

Common override order for downstream projects:

1. `app/app.config.ts`: UI tokens, labels, config-level behavior.
2. `app/assets/css/main.css`: brand/theme tokens and utility-level styling.
3. `app/components/*`: targeted UI component overrides.
4. Auth pages/composables only when authentication UX/policy differs.

## Boundary Guidelines

- Avoid importing internals from another layer's implementation folders.
- Use the established `~/types`, `~/composables`, `~/utils`, and `~/components` contracts for shared theme-layer APIs.
- Keep server concerns in `core`/`auth` server directories, not in `theme`.

## Notes

- Theme CSS is registered in `layers/theme/nuxt.config.ts` using a resolved file path. When a consumer provides `app/assets/css/main.css`, that file is the single entry and should import `@stir/base/layers/theme/app/assets/css/main` before its local partials.
- Core webform submission fetches Drupal CSRF tokens through shared server utilities and does not require `layers/auth`.
