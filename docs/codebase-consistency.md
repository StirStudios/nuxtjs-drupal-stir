# Codebase Consistency Guide

This project favors small, predictable file structure patterns over custom per-file style.

## Import order
- `type` imports first.
- Third-party/runtime imports next (`#imports`, `@vueuse/*`, `vue`, etc.).
- Project imports last, using aliases (`~/...`, `~~/types`) for app code.

## `script setup` component order
1. Imports
2. Props/emits/models (`defineProps`, `defineEmits`, `defineModel`, `withDefaults`)
3. App/theme/context access (`useAppConfig`, composables)
4. Local refs/computed/constants
5. Watchers/lifecycle
6. Event handlers/helpers

Keep this order stable unless a dependency relationship requires a different placement.

## Composable/plugin order
1. Imports
2. Local types/interfaces
3. Main exported function/plugin
4. Internal helpers (or above export when required for readability)

## Comments
- Prefer no comment when code is self-explanatory.
- Use short comments only for non-obvious behavior, external constraints, or edge-case intent.
- Avoid section banners and conversational comments.

## Paths and naming
- Prefer alias imports for app-level modules (`~/composables/...`, `~/utils/...`).
- Keep Nuxt naming conventions:
  - Components: `PascalCase.vue`
  - Composables: `useXxx.ts`
  - Middleware/plugins: Nuxt suffix conventions (`*.global.ts`, `*.client.ts`)

