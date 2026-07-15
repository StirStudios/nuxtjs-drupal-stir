# Auth Layer

Nuxt sub-layer for Drupal auth/account and protected-page integration. The
published root layer includes it by default.

Core Drupal webform submission does not require this layer. Shared Drupal
server utilities handle CSRF token forwarding for core endpoints.

Cookie-authenticated Drupal mutations are also CSRF-protected centrally. The
server utility fetches Drupal's session token with the forwarded session cookie
and adds `X-CSRF-Token`; page components and downstream applications do not
manage Drupal tokens directly.

## Scope

- `/auth/*` pages
- account settings page (`/account/settings`)
- auth/account composables and UI components
- auth/account server proxy routes under `/api/auth/*` and `/api/account/*`
- auth/account validation utilities

## Consumption

Downstream applications should extend the repository's root layer. Extending
this internal sub-layer alone is not a supported distribution contract.

The root configuration includes:

```ts
extends: ['./layers/core', './layers/theme', './layers/auth']
```

The full preset includes this layer; the minimal preset excludes it. Within the
full preset, leave `authIntegration.drupalAccounts` disabled when Drupal account
UI is not used; the local `/auth/protected` route remains available.

## Configuration

Drupal owns account-auth redirects, UI copy, field labels, and password policy
through `/api/auth/config`. Nuxt only needs to know whether the Drupal account
integration is installed.

The version-2 response is validated against Drupal's producer-owned auth UI
contract before it reaches composables. Unknown structure, invalid identifier
modes or password patterns, and unavailable providers retain the existing empty
local fallback. Because the endpoint is public and site-wide, visitor cookies
are not forwarded.

Drupal's public `/api/auth/register-policy` response is contract-validated
before Nuxt decides whether `/auth/register` is available. Unknown,
contradictory, malformed, or unavailable policy responses fail closed, and the
public request does not forward visitor cookies.

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
