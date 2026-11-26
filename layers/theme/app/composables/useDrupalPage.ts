import { appendResponseHeader } from 'h3'
import type { pageFetchOptions } from '../utils/pageRequest'
import type { StirDrupalPage } from '../types/DrupalPage'

export type DrupalMessage = { type: 'error' | 'success', message: string }


type FetchPageOptions = {
  query?: Record<string, unknown>
  key?: string
  getCachedData?: ReturnType<typeof pageFetchOptions>['getCachedData']
}

const PROXY_BASE = '/api/drupal-ce'
// The server renders one page per request, so its payload entry has one key;
// the browser re-keys it by URL while hydrating. A CDN may serve one cached
// render for several visitor URLs, so the server cannot key by its own URL.
const SERVER_KEY = 'page:ssr'

const emptyPage = (): StirDrupalPage => ({
  breadcrumbs: [],
  content: {},
  content_format: 'json',
  local_tasks: { primary: [], secondary: [] },
  messages: [],
  metatags: { meta: [], link: [], jsonld: [] },
  page_layout: 'default',
  title: '',
})

// A failed page fetch on the server, kept for the rest of the request: the
// layout middleware, the page and the middleware's second run while Nuxt
// renders the error each ask for the same page, and Drupal's answer does not
// change within one request. Keyed by the request, not the Nuxt app: the
// error render runs in a fresh app.
const serverPageErrors = new WeakMap<object, Map<string, unknown>>()

const withoutHash = (fullPath: string) => fullPath.split('#')[0] ?? fullPath
const clientKey = (fullPath: string) => `page:${withoutHash(fullPath)}`

/**
 * Drupal page fetching and the current-page state shared UI reads.
 *
 * getPage() keeps the outgoing page during client navigation and switches on
 * Nuxt's page:finish, when the destination is on screen, so the header,
 * breadcrumbs and regions never run ahead of the page or go blank. The page's
 * own fetchPage() ref is available at once.
 */
export function useDrupalPage() {
  const nuxtApp = useNuxtApp()
  const currentKey = useState('stir-page-current-key', () => '')
  const pendingKey = useState('stir-page-pending-key', () => '')
  const requestVersion = useState('stir-page-request-version', () => 0)
  const messages = useState<DrupalMessage[]>('stir-page-messages', () => [])

  const routeKey = () => {
    if (import.meta.server) return SERVER_KEY

    const key = clientKey(nuxtApp.$router.currentRoute.value.fullPath)

    const serverPage = nuxtApp.payload.data[SERVER_KEY]

    if (serverPage) {
      nuxtApp.payload.data[key] = serverPage
      Reflect.deleteProperty(nuxtApp.payload.data, SERVER_KEY)
    }

    return key
  }

  const promotePending = () => {
    const page = pendingKey.value ? nuxtApp.payload.data[pendingKey.value] as StirDrupalPage | undefined : undefined

    if (!page) return
    if (!page.redirect) currentKey.value = pendingKey.value
    pendingKey.value = ''
  }

  const watchNavigation = () => {
    if (import.meta.server || nuxtApp._stirPageWatched) return
    nuxtApp._stirPageWatched = true

    pendingKey.value = routeKey()
    nuxtApp.$router.afterEach((to, from, failure) => {
      if (failure || withoutHash(to.fullPath) === withoutHash(from.fullPath)) return
      requestVersion.value++
      pendingKey.value = routeKey()
    })
    nuxtApp.hook('page:finish', promotePending)
    nuxtApp.hook('app:error', () => {
      requestVersion.value++
      pendingKey.value = ''
    })
    if (nuxtApp.isHydrating || !currentKey.value) promotePending()
  }

  const queueMessages = (raw: StirDrupalPage['messages']) => {
    if (import.meta.server || !raw || Array.isArray(raw)) return

    messages.value.push(
      ...(raw.error ?? []).map(message => ({ type: 'error' as const, message })),
      ...(raw.success ?? []).map(message => ({ type: 'success' as const, message })),
    )
  }

  // Read now: the response callback runs outside the Nuxt context.
  const allowedHeaders = import.meta.server
    ? useRuntimeConfig().drupalCe?.passThroughHeaders ?? []
    : []

  const passThroughHeaders = (headers: Headers) => {
    const event = nuxtApp.ssrContext?.event

    if (!event) return
    for (const name of allowedHeaders) {
      const values = name === 'set-cookie' ? headers.getSetCookie() : [headers.get(name)]

      for (const value of values) {
        if (value) appendResponseHeader(event, name, value)
      }
    }
  }

  async function fetchPage(
    path: string,
    options: FetchPageOptions = {},
    onError: (error: { value: unknown }) => never | void = defaultPageError,
  ): Promise<Ref<StirDrupalPage>> {
    watchNavigation()

    const version = import.meta.client ? ++requestVersion.value : requestVersion.value
    const requestRoute = import.meta.client ? withoutHash(nuxtApp.$router.currentRoute.value.fullPath) : ''
    const key = options.key ?? routeKey()
    const failedKey = `${key}:${path}`
    const requestEvent = import.meta.server ? nuxtApp.ssrContext?.event : undefined
    const serverErrors = requestEvent ? serverPageErrors.get(requestEvent) : undefined

    if (serverErrors?.has(failedKey)) {
      onError({ value: serverErrors.get(failedKey) })

      return ref({ ...emptyPage(), key })
    }

    const { data, error } = await useFetch<StirDrupalPage>(path, {
      key,
      baseURL: PROXY_BASE,
      query: options.query,
      credentials: 'include',
      headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
      // The proxy's answer stands: a 5xx from the CMS is not asked for twice.
      retryStatusCodes: [],
      // Nuxt types getCachedData with its own app type; pageRequest narrows it.
      ...(options.getCachedData ? { getCachedData: options.getCachedData as never } : {}),
      onResponse: import.meta.server ? ({ response }) => passThroughHeaders(response.headers) : undefined,
    })
    let page = data as Ref<StirDrupalPage>

    // A newer navigation started while this one waited: leave its state alone.
    if (import.meta.client && (version !== requestVersion.value
      || requestRoute !== withoutHash(nuxtApp.$router.currentRoute.value.fullPath))) {
      if (page.value) page.value.key = key

      return page.value ? page : ref(emptyPage())
    }

    queueMessages(page.value?.messages)

    const redirect = page.value?.redirect

    if (redirect) {
      await nuxtApp.runWithContext(() => navigateTo(redirect.url, {
        external: redirect.external,
        redirectCode: redirect.statusCode,
        replace: true,
      }))

      return ref({ ...emptyPage(), key })
    }

    if (error.value) {
      if (requestEvent) {
        if (!serverPageErrors.has(requestEvent)) serverPageErrors.set(requestEvent, new Map())
        serverPageErrors.get(requestEvent)!.set(failedKey, error.value)
      }
      onError({ value: error.value })
      page = ref(emptyPage())
    }
    else if (!page.value) {
      page.value = emptyPage()
    }

    page.value.key = key
    if (import.meta.server) currentKey.value = key
    else pendingKey.value = key

    return page
  }

  function getPage(customKey?: string) {
    if (!customKey) watchNavigation()

    return computed<StirDrupalPage>(() => {
      const key = customKey || currentKey.value
      const current = key ? nuxtApp.payload.data[key] as StirDrupalPage | undefined : undefined

      if (current) return current

      const pending = !customKey && pendingKey.value
        ? nuxtApp.payload.data[pendingKey.value] as StirDrupalPage | undefined
        : undefined

      return pending && !pending.redirect ? pending : emptyPage()
    })
  }

  return {
    fetchPage,
    getPage,
    getMessages: () => messages,
  }
}

function defaultPageError(error: { value: unknown }): never {
  const value = error.value as { statusCode?: number, message?: string }

  throw createError({
    statusCode: value?.statusCode ?? 500,
    statusMessage: value?.message,
    fatal: true,
  })
}

declare module '#app' {
  interface NuxtApp {
    _stirPageWatched?: boolean
  }
}
