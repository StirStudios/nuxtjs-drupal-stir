import { appendResponseHeader } from 'h3'
import type { pageFetchOptions } from '../utils/pageRequest'

export type DrupalMessage = { type: 'error' | 'success', message: string }

type DrupalPagePayload = {
  key?: string
  title?: string
  content?: unknown
  messages?: { error?: string[], success?: string[] } | unknown[]
  redirect?: { url: string, statusCode?: number, external?: boolean }
  [key: string]: unknown
}

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

const emptyPage = (): DrupalPagePayload => ({
  breadcrumbs: [],
  content: {},
  content_format: 'json',
  local_tasks: { primary: [], secondary: [] },
  messages: [],
  metatags: { meta: [], link: [], jsonld: [] },
  page_layout: 'default',
  title: '',
})

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
    const page = pendingKey.value ? nuxtApp.payload.data[pendingKey.value] as DrupalPagePayload | undefined : undefined

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

  const queueMessages = (raw: DrupalPagePayload['messages']) => {
    if (import.meta.server || !raw || Array.isArray(raw)) return

    messages.value.push(
      ...(raw.error ?? []).map(message => ({ type: 'error' as const, message })),
      ...(raw.success ?? []).map(message => ({ type: 'success' as const, message })),
    )
  }

  // Read now: the response callback runs outside the Nuxt context.
  const allowedHeaders = import.meta.server
    ? (useRuntimeConfig().drupalCe as { passThroughHeaders?: string[] } | undefined)?.passThroughHeaders ?? []
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
  ): Promise<Ref<DrupalPagePayload>> {
    watchNavigation()

    const version = import.meta.client ? ++requestVersion.value : requestVersion.value
    const requestRoute = import.meta.client ? withoutHash(nuxtApp.$router.currentRoute.value.fullPath) : ''
    const key = options.key ?? routeKey()
    const { data, error } = await useFetch<DrupalPagePayload>(path, {
      key,
      baseURL: PROXY_BASE,
      query: options.query,
      credentials: 'include',
      headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
      // Nuxt types getCachedData with its own app type; pageRequest narrows it.
      ...(options.getCachedData ? { getCachedData: options.getCachedData as never } : {}),
      onResponse: import.meta.server ? ({ response }) => passThroughHeaders(response.headers) : undefined,
    })
    let page = data as Ref<DrupalPagePayload>

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

    return computed<DrupalPagePayload>(() => {
      const key = customKey || currentKey.value
      const current = key ? nuxtApp.payload.data[key] as DrupalPagePayload | undefined : undefined

      if (current) return current

      const pending = !customKey && pendingKey.value
        ? nuxtApp.payload.data[pendingKey.value] as DrupalPagePayload | undefined
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
