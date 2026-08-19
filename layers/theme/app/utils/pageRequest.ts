export type PageRequestRoute = {
  path?: string
  fullPath?: string
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
