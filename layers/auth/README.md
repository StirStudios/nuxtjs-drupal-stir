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

- `registerAccountNavVisibility`
- `useAccountNav`
- `useAuthActions`
- `useAuthConfig`
- `useAuthLogin`
- `useAuthRegister`
- `useAuthSession`
- `useAuthVerify`
- `usePasswordRequest`
- `usePasswordReset`
- `useProtectedActions`
- `useProtectedLogin`
- `createLoginValidationSchema`
- `createPasswordRequestValidationSchema`
- `createRegisterValidationSchema`
- `createPasswordResetValidationSchema`
- `createAccountPasswordChangeValidationSchema`

### Account settings

`useAccountSettings()` loads and saves the account name and email through
`/api/account/settings/values`. Only fields Drupal marks editable are compared
or sent.

- `reset()` discards unsaved edits, restoring the last loaded or saved values
  and clearing `current_password`. Call it when an edit dialog closes.
- `emailChangeRequiresCurrentPassword` (readonly ref) reports whether Drupal
  requires the current password for an email change at all, so a page can show
  the password input up front. `requiresCurrentPassword` stays true only once
  the email has actually changed.

### Account navigation

`useAccountNav()` returns `items`, a computed list for `UNavigationMenu`, used
by the `account` layout. It defaults to a single Settings link. Replace the
list in `app.config`; a non-empty `items` replaces the default rather than
extending it:

```ts
export default defineAppConfig({
  auth: {
    accountNav: {
      items: [
        { label: 'Settings', icon: 'i-lucide-settings', to: '/account/settings' },
        { label: 'Profile', icon: 'i-lucide-user-round', to: '/account/profile' },
        { label: 'Billing', icon: 'i-lucide-credit-card', to: '/account/billing', visibility: 'billing' },
      ],
    },
  },
})
```

An item with `visibility` is shown only while the resolver registered for that
key returns `true`, and stays hidden if no resolver is registered. Register
resolvers from a plugin:

```ts
export default defineNuxtPlugin(() => {
  registerAccountNavVisibility('billing', () => {
    const { data } = useFetch<{ has_customer?: boolean }>('/api/stripe/access')

    return () => data.value?.has_customer === true
  })
})
```

A resolver runs in the setup of each component calling `useAccountNav()`, so
composables are available, and it may return a boolean, ref or getter.
Resolvers are stored per Nuxt app instance, so they never leak between SSR
requests. Resolve on the server where possible (as above) so the item is
present in the SSR HTML; with `server: false` it appears after hydration.

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

### Sign-in errors

A failed sign-in shows Drupal's message under the title "Couldn't sign you in".
When Drupal answers with `code: 'verification_required'`, the error carries a
"Resend verification email" action that posts the entered identifier to
`/api/auth/verify/resend`. Drupal's reply does not reveal whether the account
exists.

By default the error is a toast. The layer's `/auth/login` page shows it inline
instead, which stays on screen and is announced once:

```vue
<script setup lang="ts">
const { error, errorActions, ...login } = useAuthLogin({ toastErrors: false })
</script>

<!-- Inside <AuthCard>, after any Turnstile field. -->
<template #validation>
  <UAlert
    v-if="error"
    :actions="errorActions"
    color="error"
    :description="error.message"
    role="alert"
    :title="error.title"
    variant="subtle"
  />
</template>
```

### Verification redirect

`/auth/verify` carries a safe same-site `?redirect=` through to the sign-in
link and the post-verification navigation, so a destination chosen before
sign-up survives email verification. Unsafe values (`//host`, `/\host`,
absolute or non-path URLs) are dropped using the same check as
`useAuthLogin()`.

A project that remembers the destination elsewhere (for example in a cookie)
overrides the page and supplies a fallback, which is held to the same rule:

```ts
const { isLoading, verified, message, title, loginTarget, verify }
  = useAuthVerify({ fallbackRedirect: () => rememberedPath.value })

onMounted(verify)
```

`AuthSecondaryAction` accepts a route location object for `to`.

### Extra signup fields

`/auth/register` renders `AuthRegister`, which owns the form, Turnstile, error
toasts and the verification and approval-required states. A project that needs
more signup inputs overrides the page with a thin wrapper and fills the
`fields` slot instead of copying the form:

```vue
<script setup lang="ts">
const options = {
  initialState: { first_name: '', newsletter: false },
  toFields: (state: { first_name: string, newsletter: boolean }) => ({
    first_name: state.first_name.trim(),
    newsletter: state.newsletter,
  }),
  validate: (state: { first_name?: string }) =>
    state.first_name?.trim()
      ? []
      : [{ name: 'first_name', message: 'First name is required' }],
}
</script>

<template>
  <AuthRegister :options="options">
    <template #fields="{ state }">
      <UFormField label="First name" name="first_name" required>
        <UInput v-model="state.first_name" autocomplete="given-name" class="w-full" />
      </UFormField>
      <USwitch v-model="state.newsletter" label="Send me the newsletter" />
    </template>
  </AuthRegister>
</template>
```

- `options` is read once during setup and passed to
  `useAuthRegister(options)`, which a fully custom page can call directly and
  which returns the extra values as `state`.
- `initialState` is copied, so instances never share values. `toFields` maps
  `state` to the registration `fields` payload (default: the state as-is);
  `fields` is omitted when empty, so no options sends the original payload.
- `validate` errors merge with the email and password errors. Name each error
  after its `UFormField` so the message and `aria-invalid`/`aria-describedby`
  attach to that input.
- The `fields` slot renders after the password, before Turnstile. A `footer`
  slot replaces the sign-in link, for example to carry `?redirect=`.

`POST /api/auth/register` forwards `fields` to Drupal's registration presave
event only when every key is lower-case snake case, is not a base user entity
key (`roles`, `status`, `uid`, `name`, `mail`, `pass`, ...), and holds a
string, number, boolean, null, or list of scalars. Anything else fails with a
400 before Drupal is called. Restrict the accepted keys further with
`runtimeConfig.stirAuthRegister.allowedFields` (or
`NUXT_STIR_AUTH_REGISTER_ALLOWED_FIELDS='["first_name","newsletter"]'`).
Drupal remains responsible for validating and saving each value.
