type DrupalPageUser = {
  authenticated?: boolean
  id?: number | string
  uid?: number | string
  roles?: unknown
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

export function resolveDrupalPageAccess(
  page: DrupalPageAccessSource | null | undefined,
) {
  const user = page?.current_user
  const roles = Array.isArray(user?.roles)
    ? user.roles.filter((role): role is string => typeof role === 'string')
    : []
  const isAdministrator = roles.includes('administrator')
  const isAuthenticated =
    user?.authenticated === true
    || hasPositiveId(user?.uid)
    || hasPositiveId(user?.id)
    || roles.includes('authenticated')
    || isAdministrator
  const tasks = page?.local_tasks
  const hasLocalTasks = [tasks?.primary, tasks?.secondary]
    .some(group => Array.isArray(group) && group.some(hasEditorialTask))

  return {
    isAdministrator,
    isAuthenticated,
    hasEditorialAccess: isAdministrator || (isAuthenticated && hasLocalTasks),
  }
}

export type DrupalPageAccess = ReturnType<typeof resolveDrupalPageAccess>

/**
 * Combines route-specific tasks with a stable authenticated-user snapshot.
 */
export function mergeDrupalPageAccess(
  routeAccess: DrupalPageAccess,
  sessionAccess: DrupalPageAccess,
): DrupalPageAccess {
  const isAdministrator = routeAccess.isAdministrator || sessionAccess.isAdministrator
  const isAuthenticated = routeAccess.isAuthenticated || sessionAccess.isAuthenticated

  return {
    isAdministrator,
    isAuthenticated,
    hasEditorialAccess: isAdministrator || routeAccess.hasEditorialAccess,
  }
}
