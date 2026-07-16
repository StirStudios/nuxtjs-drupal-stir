# Layers Guide

This repository is structured into focused Nuxt layers with clear ownership:

- `layers/core`: server/runtime integration concerns (Drupal API proxy utilities, secure API middleware, shared backend endpoints).
- `layers/theme`: UI/theming concerns (components, layouts, styles, app-facing composables, UI helpers).
- `layers/auth`: authentication and account flows (auth pages, auth/account composables, auth/account API routes, auth middleware).
- `layers/webform`: Drupal Webform rendering, validation, and submission.
- `layers/turnstile`: shared Cloudflare Turnstile registration, runtime configuration, and interaction-only field used independently by auth and Webforms.
- `layers/editorial`: authenticated Drupal editing controls and local tasks.
- `layers/integrations`: optional popup/privacy UI and the shared consent policy used by analytics and trusted scripts.
- `layers/analytics`: optional Plausible integration.
- `layers/scripts`: optional third-party script integrations.
- `layers/diagnostics`: repository-only performance analysis selected explicitly by maintainers; never registered by installed consumers.
- `server/utils`: shared Nitro utilities used by multiple layers when behavior must stay identical across boundaries.

## Ownership Rules

- Put code in the layer that owns the behavior.
- Keep capability-specific app-config defaults with that layer; the theme layer must not make disabled integrations appear installed.
- Keep layer-internal logic inside that layer.
- Keep root-level config focused on orchestration (`extends`, shared modules/runtime config).
- Put cross-layer server behavior in `server/utils` and keep layer-local files as stable wrappers when downstream imports may exist.

## Type Placement

- Keep a type beside the component, composable, route, or utility when it describes only that implementation.
- Put browser-only public contracts and declaration augmentation in the owning layer's `app/types/*` directory. Theme contracts are imported through `~/types` inside the theme layer.
- Put contracts used by both app and server code in the owning layer's `shared/types/*` directory. Import these explicitly from both sides so ownership stays visible and the browser never reaches into `server/*`.
- Keep server-only request, storage, and upstream response shapes beside the server code that owns them unless several server files share the contract.
- Do not create a global type folder for unrelated convenience types, and do not move a one-use props or rendering shape away from its implementation.

## Import Policy

- Use Nuxt auto-imports for Nuxt and Vue runtime APIs in normal files under `app/*` (for example `ref`, `computed`, `useRoute`, `useAppConfig`, and `defineNuxtPlugin`).
- Keep type imports explicit, including Vue and Nuxt types.
- Keep external packages such as `@vueuse/core`, Valibot, and Nuxt UI utilities explicit. This makes dependency and bundle ownership clear; installing another auto-import module merely to hide these imports is not worthwhile.
- Keep imports explicit in server code, Nuxt configuration, build/audit scripts, and isolated tests because those files do not share the application auto-import context.
- Keep cross-layer imports explicit. Auto-imports are a public app surface, not a way to hide a dependency on another layer's internals.
- Use the explicit `#stir/utils`, `#stir/composables`, `#stir/components`, and `#stir/types` aliases for supported Stir-owned app contracts. The historical `~/...` aliases remain available only to preserve existing consumers during the compatibility window; new layer and consumer code should not use them.

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
- Auth and Webforms both extend `layers/turnstile`; neither capability must load the other to render mandatory bot protection.
- Analytics and Scripts extend `layers/integrations`; the minimal preset loads none of the popup/privacy components, composables, defaults, or consent plugin.
- `STIR_PERF_ANALYZE=true` selects the diagnostics layer only for builds launched from this repository root. Installed minimal/full consumers never receive its filesystem report writer.
