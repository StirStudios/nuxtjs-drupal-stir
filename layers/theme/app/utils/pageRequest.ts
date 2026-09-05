export type PageRequestRoute = {
  path?: string
  fullPath?: string
}

export function withoutLegacyDrupalViewPage<T>(query: Record<string, T>) {
  const { page: _legacyPage, ...namespacedQuery } = query

  return namespacedQuery
}

export function resolvePageRequest(route: PageRequestRoute) {
  const path = typeof route.path === 'string' && route.path.trim()
    ? route.path
    : '/'

  return {
    path,
    key: path,
  }
}
