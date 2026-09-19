type DrupalCapabilities = {
  editorialUi?: unknown
}

type DrupalPageUser = {
  authenticated?: boolean
  id?: number | string
  uid?: number | string
  capabilities?: DrupalCapabilities | null
}

type DrupalLocalTasks = {
  primary?: unknown
  secondary?: unknown
}

type DrupalPageAccessSource = {
  current_user?: DrupalPageUser | null
  local_tasks?: DrupalLocalTasks | null
}

const hasPositiveId = (value: unknown): boolean => {
  const id = Number(value)

  return Number.isInteger(id) && id > 0
}

const hasEditorialTask = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false

  const label = 'label' in value && typeof value.label === 'string'
    ? value.label.trim().toLowerCase()
    : ''

  return label !== '' && !['api', 'view'].includes(label)
}

/**
 * Reads editorial access from Drupal's own answers: the permission-based
 * `editorialUi` capability, or local tasks Drupal already access-checked.
 */
export function resolveDrupalPageAccess(
  page: DrupalPageAccessSource | null | undefined,
) {
  const user = page?.current_user
  const isAuthenticated =
    user?.authenticated === true
    || hasPositiveId(user?.uid)
    || hasPositiveId(user?.id)
  const tasks = page?.local_tasks
  const hasLocalTasks = [tasks?.primary, tasks?.secondary]
    .some(group => Array.isArray(group) && group.some(hasEditorialTask))

  return {
    isAuthenticated,
    hasEditorialAccess:
      user?.capabilities?.editorialUi === true
      || (isAuthenticated && hasLocalTasks),
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
 * Combines route-specific tasks with a stable authenticated-user snapshot.
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
