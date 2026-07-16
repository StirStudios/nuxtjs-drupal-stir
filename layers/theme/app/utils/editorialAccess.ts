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
  const hasLocalTasks =
    (Array.isArray(tasks?.primary) && tasks.primary.length > 0)
    || (Array.isArray(tasks?.secondary) && tasks.secondary.length > 0)

  return {
    isAdministrator,
    isAuthenticated,
    hasEditorialAccess: isAdministrator || (isAuthenticated && hasLocalTasks),
  }
}
