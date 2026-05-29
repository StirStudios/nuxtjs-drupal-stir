# Auth Layer

Optional Nuxt layer for Drupal auth/account integration.

Core Drupal webform submission does not require this layer. Shared Drupal
server utilities handle CSRF token forwarding for core endpoints.

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
    accountEnabled: true,
    submitButton: {
      class: '',
      size: 'xl',
      variant: 'solid',
    },
  },
})
```

Set `auth.accountEnabled: false` when a project only needs `/auth/protected`
for password-protected Nuxt pages. Account UI routes are redirected to
`auth.protectedFallbackRedirectPath`, while protected-page access keeps working.

Page-level submit props passed to `AuthCard` take priority over `auth.submitButton`.
