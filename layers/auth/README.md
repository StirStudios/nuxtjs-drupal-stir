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

Downstream applications that only need auth/account may extend this capability
directly. It composes Turnstile and the shared foundation without loading the
Drupal CE website platform, theme, menus, app context, or View/Paragraph routes.

The root configuration includes:

```ts
extends: ['@stir/base/layers/auth/nuxt.config']
```

The full preset includes this layer; the minimal preset excludes it. The local
`/auth/protected` route remains available independently of Drupal accounts.

## Configuration

Drupal owns account-auth redirects, UI copy, field labels, and password policy
through `/api/auth/config`, including whether frontend accounts are enabled.

The version-2 response is validated against Drupal's producer-owned auth UI
contract before it reaches composables. Unknown structure, invalid identifier
modes or password patterns, and unavailable providers retain the existing empty
local fallback. Because the endpoint is public and site-wide, visitor cookies
are not forwarded.

Drupal's public `/api/auth/register-policy` response is contract-validated
before Nuxt decides whether `/auth/register` is available. Unknown,
contradictory, malformed, or unavailable policy responses fail closed, and the
public request does not forward visitor cookies.

Disable **Decoupled frontend accounts** in Drupal when a project only needs
`/auth/protected`. Account UI routes then redirect to
`protectedRoutes.fallbackRedirectPath`, while protected-page access keeps
working. No downstream Nuxt feature flag is required.

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
    backgroundClass: 'bg-muted/50 dark:bg-default',
    showBackgroundDecoration: true,
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
the image or illustration in split layouts. `backgroundClass`,
`showBackgroundDecoration`, `backgroundImage`, `imagePosition`, `showIcon`, and
`backButton` support the same global and per-page structure. The default auth
canvas uses semantic Nuxt UI surfaces and subtle primary-color decoration;
projects can replace `backgroundClass` or disable the decoration without a
component override.
`submitButton` accepts Nuxt UI `UButton` props, such as `size: 'xl'`, `color`,
`variant`, `icon`, and `class`. Drupal remains the source for auth
behaviour, fields, copy, password policy, and redirects. Drupal presentation
values are not read; configure all auth layouts and visuals through
`stirTheme.auth`.

Hardcoded strings in auth composables/pages (for example `|| 'Sign in'`) are
last-resort fallbacks only, shown before `/api/auth/config` resolves or if
Drupal ever omits a key. They are not a content surface and do not need to
match Drupal's configured copy word-for-word.

## Public Helpers

Downstream projects with local auth page overrides can use the auth layer's
public auto-import surface instead of importing from nested layer internals:

- `useAuthActions`
- `useAuthConfig`
- `useAuthLogin`
- `useAuthRegister`
- `useAuthSession`
- `usePasswordRequest`
- `usePasswordReset`
- `useProtectedActions`
- `useProtectedLogin`
- `createLoginValidationSchema`
- `createPasswordRequestValidationSchema`
- `createRegisterValidationSchema`
- `createPasswordResetValidationSchema`
- `createAccountPasswordChangeValidationSchema`

### Post-login destination

`useAuthLogin()` sends the visitor to `?redirect=` when it is a safe same-site
path, and otherwise to Drupal's `loginRedirectPath`. Both are checked, so a
protocol-relative or absolute URL from either source falls back to `/` rather
than navigating off-site.

A page that has to decide the destination itself — because it depends on the
account that just signed in — passes a callback instead of reimplementing the
form:

```ts
const { fields, validate, onSubmit } = useAuthLogin({
  redirectTo: async ({ redirect, fallback }) => {
    if (redirect) return redirect
    if (await needsOnboarding()) return '/onboarding'

    return fallback
  },
})
```

The callback runs after the session resolves. Its return value is used as
given, so pass a query parameter through `redirect` from the context rather
than reading one yourself. Return `false` to navigate nowhere and let the page
take over.
