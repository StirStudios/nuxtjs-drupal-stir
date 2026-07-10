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
      size: 'xl',
      class: 'uppercase',
    },
  },
},
```

Auth layouts are also frontend theme settings. Use `card`, `card-split`, or
`page-split` globally, then override individual routes when needed:

```ts
stirTheme: {
  auth: {
    layout: 'card-split',
    backgroundImage: '/themes/custom/site/auth.jpg',
    imagePosition: 'left',
    pages: {
      login: {
        layout: 'page-split',
        backgroundImage: '/themes/custom/site/login.jpg',
      },
      logout: {
        layout: 'card',
        backgroundImage: '/themes/custom/site/logout.jpg',
      },
      passwordReset: {
        layout: 'card-split',
        backgroundImage: '/themes/custom/site/reset-password.jpg',
      },
    },
  },
},
```

`imagePosition` accepts `'left'` or `'right'`; it controls which side displays
the image or illustration in split layouts. `backgroundImage`, `imagePosition`,
`showIcon`, and `backButton` support the same global and per-page structure.
`submitButton` accepts Nuxt UI `UButton` props, such as `size: 'xl'`, `color`,
`variant`, `icon`, and `class`. Drupal remains the source for auth
behaviour, fields, copy, password policy, and redirects. Drupal presentation
values are not read; configure all auth layouts and visuals through
`stirTheme.auth`.

## Public Helpers

Downstream projects with local auth page overrides can use the auth layer's
public auto-import surface instead of importing from nested layer internals:

- `useAuthConfig`
- `createLoginValidationSchema`
- `createPasswordRequestValidationSchema`
- `createRegisterValidationSchema`
- `createPasswordResetValidationSchema`
- `createAccountPasswordChangeValidationSchema`
