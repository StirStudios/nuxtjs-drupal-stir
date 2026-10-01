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

type PageCacheApp = {
  isHydrating?: boolean
  payload: { data: Record<string, unknown> }
  static: { data: Record<string, unknown> }
  $router: { currentRoute: { value: { fullPath: string } } }
}

// The page payload the client layout middleware fetched for the navigation in
// progress, keyed by the Nuxt app. One entry: each navigation replaces it.
const prefetchedPages = new WeakMap<object, { fullPath: string, page: unknown }>()

const withoutHash = (fullPath: string) => fullPath.split('#')[0] ?? fullPath

/** Hands a page payload fetched in route middleware to the page's fetchPage(). */
export function rememberPrefetchedPage(nuxtApp: object, fullPath: string, page: unknown): void {
  prefetchedPages.set(nuxtApp, { fullPath: withoutHash(fullPath), page })
}

export function forgetPrefetchedPage(nuxtApp: object): void {
  prefetchedPages.delete(nuxtApp)
}

/**
 * fetchPage() options that reuse the request the layout middleware already
 * made, so Drupal is asked once per page. On the server the middleware's
 * fetchPage() shares this request's payload. On the client the middleware's
 * payload is used once, by the page it was fetched for; a refresh, or any
 * later fetch, goes to Drupal. Otherwise Nuxt's default applies: the server
 * payload while hydrating.
 */
export function pageFetchOptions() {
  if (import.meta.server) {
    return { getCachedData: (key: string, nuxtApp: PageCacheApp) => nuxtApp.payload.data[key] }
  }

  return {
    getCachedData: (key: string, nuxtApp: PageCacheApp, context: { cause: string }) => {
      const prefetched = prefetchedPages.get(nuxtApp)
      const refresh = context.cause === 'refresh:manual' || context.cause === 'refresh:hook'

      if (prefetched && !refresh) {
        prefetchedPages.delete(nuxtApp)

        if (prefetched.fullPath === withoutHash(nuxtApp.$router.currentRoute.value.fullPath)) {
          return prefetched.page
        }
      }

      if (nuxtApp.isHydrating) return nuxtApp.payload.data[key]

      return refresh ? undefined : nuxtApp.static.data[key]
    },
  }
}

/** @deprecated Use pageFetchOptions(), which also reuses the page in the browser. */
export const serverPageFetchOptions = pageFetchOptions
