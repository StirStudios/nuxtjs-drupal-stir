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

/**
 * On the server, reuse a page this request already fetched. The layout
 * middleware and Drupal/PageRoute.vue both call fetchPage() for the same key;
 * Nuxt only reuses data during hydration by default, so without this Drupal
 * would be asked twice. Client navigation always fetches.
 */
export function serverPageFetchOptions() {
  return import.meta.server
    ? { getCachedData: (key: string, nuxtApp: { payload: { data: Record<string, unknown> } }) => nuxtApp.payload.data[key] }
    : {}
}
