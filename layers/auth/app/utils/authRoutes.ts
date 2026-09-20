/** Auth pages a signed-in visitor is redirected away from. */
export const GUEST_ONLY_AUTH_PATHS: ReadonlySet<string> = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/password/request',
  '/auth/password/reset',
])

/** Auth pages that only exist when Drupal accounts are enabled. */
export const ACCOUNT_AUTH_PATHS: ReadonlySet<string> = new Set([
  ...GUEST_ONLY_AUTH_PATHS,
  '/auth/verify',
])

/** Every auth page; protected-content gating must never block these. */
export const AUTH_SYSTEM_PATHS: ReadonlySet<string> = new Set([
  ...ACCOUNT_AUTH_PATHS,
  '/auth/logout',
])
