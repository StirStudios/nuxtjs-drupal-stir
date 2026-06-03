export type PageRequestRoute = {
  path: string
  fullPath: string
}

export function resolvePageRequest(route: PageRequestRoute) {
  return {
    path: route.path,
    key: route.fullPath.split('#')[0] ?? route.path,
  }
}
