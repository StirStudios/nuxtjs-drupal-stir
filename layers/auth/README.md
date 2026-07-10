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

Drupal owns account-auth redirects, UI copy, field labels, and password policy
through `/api/auth/config`. Nuxt only needs to know whether the Drupal account
integration is installed.

```ts
export default defineAppConfig({
  authIntegration: {
    drupalAccounts: true,
  },
})
```

Leave `authIntegration.drupalAccounts` unset or `false` when a project only
needs `/auth/protected` for password-protected Nuxt pages. Account UI routes are
redirected to `protectedRoutes.fallbackRedirectPath`, while protected-page
access keeps working.

Normal pages only read this integration flag. Drupal auth UI configuration is
requested only by account and auth routes that need it.

Theme all auth submit buttons from Nuxt without adding presentation settings to
Drupal:

```ts
stirTheme: {
  auth: {
    submitButton: {
      class: 'uppercase',
    },
  },
},
```

## Public Helpers

Downstream projects with local auth page overrides can use the auth layer's
public auto-import surface instead of importing from nested layer internals:

- `useAuthConfig`
- `createLoginValidationSchema`
- `createPasswordRequestValidationSchema`
- `createRegisterValidationSchema`
- `createPasswordResetValidationSchema`
- `createAccountPasswordChangeValidationSchema`
