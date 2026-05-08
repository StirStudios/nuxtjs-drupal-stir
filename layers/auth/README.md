# Auth Layer

Optional Nuxt layer for Drupal auth/account integration.

## Scope

- `/auth/*` pages
- account settings page (`/account/settings`)
- account profile page (`/account/profile`)
- auth/account composables and UI components
- auth/account server proxy routes under `/api/auth/*` and `/api/account/*`
- auth/account validation utilities

## Enable

Add this layer to your project:

```ts
export default defineNuxtConfig({
  extends: ['./layers/auth'],
})
```

For this repository itself, the root `nuxt.config.ts` already includes:

```ts
extends: ['./layers/auth']
```
