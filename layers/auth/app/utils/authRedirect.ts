/**
 * Resolves a post-authentication destination to a safe same-site path.
 *
 * Auth redirects come from a query parameter a visitor controls and from a
 * Drupal-owned config value, so neither may be navigated to unchecked. Only an
 * absolute path on this site is accepted; anything else falls back.
 *
 * This deliberately does not reuse the webform layer's resolver, which permits
 * external `http(s)` targets because a Webform confirmation may legitimately
 * leave the site. Sending someone off-site immediately after they authenticate
 * is an open redirect, so the rules here are stricter.
 */

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0)

    return code <= 31 || code === 127
  })
}

function isSafeInternalPath(value: string): boolean {
  return (
    value.startsWith('/')
    // A protocol-relative path such as //evil.com is an external navigation.
    && !value.startsWith('//')
    // Browsers normalise a backslash to a slash, so /\evil.com is too.
    && !value.startsWith('/\\')
    && !hasControlCharacter(value)
  )
}

/**
 * Returns `candidate` when it is a safe same-site path, otherwise `fallback`.
 *
 * The fallback is held to the same rule, so a misconfigured Drupal redirect
 * path degrades to `/` rather than becoming the open redirect it would be if
 * it were trusted.
 */
export function resolveStirAuthRedirect(
  candidate: unknown,
  fallback: string = '/',
): string {
  if (typeof candidate === 'string') {
    const value = candidate.trim()

    if (value && isSafeInternalPath(value)) return value
  }

  const fallbackValue = typeof fallback === 'string' ? fallback.trim() : ''

  return fallbackValue && isSafeInternalPath(fallbackValue)
    ? fallbackValue
    : '/'
}

/**
 * Returns a safe same-site path, or undefined when the candidate is unusable.
 *
 * Callers that need to tell "no usable destination was supplied" apart from
 * "the default was chosen" use this rather than the fallback form.
 */
export function safeStirAuthRedirect(candidate: unknown): string | undefined {
  if (typeof candidate !== 'string') return undefined

  const value = candidate.trim()

  return value && isSafeInternalPath(value) ? value : undefined
}

/**
 * Builds the account-login target for a visitor bounced off a guarded route.
 *
 * `useAuthLogin()` returns the visitor to `?redirect=`, so whatever sends them
 * to the login page has to carry their destination. Omits the parameter when
 * there is nothing useful to return to, rather than round-tripping the login
 * page into itself.
 */
export function stirAuthLoginTarget(
  fullPath: unknown,
  loginPath: string = '/auth/login',
): { path: string, query?: { redirect: string } } {
  const redirect = safeStirAuthRedirect(fullPath)

  if (!redirect) return { path: loginPath }

  const [pathOnly] = redirect.split('?')

  if (pathOnly === loginPath) return { path: loginPath }

  return { path: loginPath, query: { redirect } }
}
