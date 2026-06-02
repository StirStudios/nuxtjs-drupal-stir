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
    backgroundImage: '/images/auth.jpg',
    layout: 'card',
    imagePosition: 'left',
    showIcon: true,
    backButton: {
      enabled: false,
      label: 'Back',
      to: '/',
    },
    submitButton: {
      class: '',
      size: 'xl',
      variant: 'solid',
    },
    login: {
      backgroundImage: '/images/login.jpg',
      layout: 'page-split',
      imagePosition: 'right',
      showIcon: false,
    },
  },
})
```

Auth pages support three layouts:

- `card`: centered auth card over an optional full-page background image.
- `page-split`: full-height image panel on one side and the auth form on the other.
- `card-split`: auth card with an image panel on one side and the form on the other.

Set `auth.imagePosition` or a page-level `imagePosition` to `left` or `right`.
Page-level values under `auth.login`, `auth.register`, `auth.passwordRequest`,
`auth.passwordReset`, and `auth.protectedPage` override the global auth values.
Set `showIcon: false` globally or on an auth page to hide the auth form icon.
Set `auth.backButton.enabled: true` to render a fixed auth-shell back button.

Set `auth.accountEnabled: false` when a project only needs `/auth/protected`
for password-protected Nuxt pages. Account UI routes are redirected to
`auth.protectedFallbackRedirectPath`, while protected-page access keeps working.

Page-level submit props passed to `AuthCard` take priority over `auth.submitButton`.
