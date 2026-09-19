type DrupalCapabilities = {
  editorialUi?: unknown
}

type DrupalPageUser = {
  authenticated?: boolean
  id?: number | string
  uid?: number | string
  capabilities?: DrupalCapabilities | null
}

type DrupalPageAccessSource = {
  current_user?: DrupalPageUser | null
}

const hasPositiveId = (value: unknown): boolean => {
  const id = Number(value)

  return Number.isInteger(id) && id > 0
}

/**
 * Reads access from Drupal's own answer. Only the `editorialUi` capability,
 * backed by the 'access stir editorial ui' permission, grants the editorial
 * UI; local tasks are displayed but never decide access.
 */
export function resolveDrupalPageAccess(
  page: DrupalPageAccessSource | null | undefined,
) {
  const user = page?.current_user
  const isAuthenticated =
    user?.authenticated === true
    || hasPositiveId(user?.uid)
    || hasPositiveId(user?.id)

  return {
    isAuthenticated,
    hasEditorialAccess: user?.capabilities?.editorialUi === true,
  }
}

export type DrupalPageAccess = ReturnType<typeof resolveDrupalPageAccess>

type AuthSessionAccessSource = {
  loggedIn?: boolean
  user?: {
    uid?: number | string
    capabilities?: DrupalCapabilities | null
  } | null
}

/**
 * Projects an auth-session snapshot onto the page payload shape so access
 * rules stay defined in one place.
 */
export function resolveAuthSessionAccess(
  session: AuthSessionAccessSource,
): DrupalPageAccess {
  return resolveDrupalPageAccess({
    current_user: session.user
      ? {
          authenticated: session.loggedIn,
          uid: session.user.uid,
          capabilities: session.user.capabilities,
        }
      : null,
  })
}

/**
 * Combines the page payload's user with the auth session's user.
 */
export function mergeDrupalPageAccess(
  routeAccess: DrupalPageAccess,
  sessionAccess: DrupalPageAccess,
): DrupalPageAccess {
  return {
    isAuthenticated: routeAccess.isAuthenticated || sessionAccess.isAuthenticated,
    hasEditorialAccess: routeAccess.hasEditorialAccess || sessionAccess.hasEditorialAccess,
  }
}
