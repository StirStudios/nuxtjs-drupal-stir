export type PageRequestRoute = {
  path: string
  fullPath: string
}

export function resolvePageRequest(route: PageRequestRoute) {
  return {
    path: route.path,
    key: route.path,
  }
}
