import type { MaybeRefOrGetter } from 'vue'

export type AppContextBlock = {
  element?: string
  props?: Record<string, unknown>
  slots?: Record<string, unknown>
  [key: string]: unknown
}

export type AppContextFooterMenuItem = {
  title?: string
  url?: string
}

export type AppContextSiteInfo = {
  name?: string
  mail?: string
  slogan?: string
  [key: string]: unknown
}

export type AppContextPayload = {
  blocks?: Record<string, unknown>
  footer_menu?: AppContextFooterMenuItem[]
  site_info?: AppContextSiteInfo
}

export type AppContextOptions = {
  immediate?: boolean
}

export type AppFooterContextPayload = Pick<
  AppContextPayload,
  'footer_menu' | 'site_info'
>

const serverAppContextRequests = new WeakMap<
  object,
  Map<string, Promise<AppContextPayload>>
>()
const appContextRequests = new Map<string, Promise<AppContextPayload>>()

export function appContextQuery(path = '/') {
  return { path: path || '/' }
}

function normalizeRegionBlocks(raw: unknown): AppContextBlock[] {
  if (Array.isArray(raw)) return raw as AppContextBlock[]
  if (raw && typeof raw === 'object') {
    return Object.values(raw as Record<string, AppContextBlock>)
  }

  return []
}

export function useAppContext(options: AppContextOptions = {}) {
  const route = useRoute()
  const path = computed(() => route.path || '/')

  return useFetch<AppContextPayload>('/api/app-context', {
    dedupe: 'defer',
    immediate: options.immediate ?? true,
    key: computed(() => `app-context:${path.value}`),
    query: computed(() => appContextQuery(path.value)),
  })
}

async function fetchSharedAppContext(path: string): Promise<AppContextPayload> {
  const normalizedPath = path || '/'

  if (import.meta.server) {
    const event = useRequestEvent()

    if (event) {
      let requests = serverAppContextRequests.get(event)

      if (!requests) {
        requests = new Map<string, Promise<AppContextPayload>>()
        serverAppContextRequests.set(event, requests)
      }

      const cached = requests.get(normalizedPath)

      if (cached) {
        return cached
      }

      const request = $fetch<AppContextPayload>('/api/app-context', {
        query: appContextQuery(normalizedPath),
      })

      requests.set(normalizedPath, request)

      return request
    }
  }

  const cached = appContextRequests.get(normalizedPath)

  if (cached) {
    return cached
  }

  const request = $fetch<AppContextPayload>('/api/app-context', {
    query: appContextQuery(normalizedPath),
  })

  appContextRequests.set(normalizedPath, request)

  request.finally(() => {
    if (appContextRequests.get(normalizedPath) === request) {
      appContextRequests.delete(normalizedPath)
    }
  })

  return request
}

export function useAppFooterContext(options: AppContextOptions = {}) {
  const route = useRoute()
  const path = computed(() => route.path || '/')

  return useAsyncData<AppFooterContextPayload>(
    computed(() => `app-footer-context:${path.value}`),
    async () => {
      const payload = await fetchSharedAppContext(path.value)

      return {
        footer_menu: payload.footer_menu,
        site_info: payload.site_info,
      }
    },
    {
      dedupe: 'defer',
      immediate: options.immediate ?? true,
    },
  )
}

export function useAppRegionBlocks(area: MaybeRefOrGetter<string>, options: AppContextOptions = {}) {
  const route = useRoute()
  const path = computed(() => route.path || '/')
  const regionArea = computed(() => toValue(area))

  return useAsyncData<AppContextBlock[]>(
    computed(() => `app-region-blocks:${path.value}:${regionArea.value}`),
    async () => {
      const payload = await fetchSharedAppContext(path.value)

      return normalizeRegionBlocks(payload.blocks?.[regionArea.value])
    },
    {
      dedupe: 'defer',
      immediate: options.immediate ?? true,
    },
  )
}
