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

export function appContextQuery(path = '/') {
  return { path: path || '/' }
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
