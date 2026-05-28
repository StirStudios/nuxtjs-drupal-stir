# Auth Layer

Optional Nuxt layer for Drupal auth/account integration.

## Scope

- `/auth/*` pages
- account settings page (`/account/settings`)
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

## Configuration

Auth form submit button defaults can be customized through app config:

```ts
export default defineAppConfig({
  auth: {
    submitButton: {
      class: '',
      size: 'xl',
      variant: 'solid',
    },
  },
})
```

Page-level submit props passed to `AuthCard` take priority over `auth.submitButton`.
