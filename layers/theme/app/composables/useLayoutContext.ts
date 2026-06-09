export type LayoutContextBlock = {
  element?: string
  props?: Record<string, unknown>
  slots?: Record<string, unknown>
  [key: string]: unknown
}

export type LayoutContextFooterMenuItem = {
  title?: string
  url?: string
}

export type LayoutContextSiteInfo = {
  name?: string
  mail?: string
  slogan?: string
  [key: string]: unknown
}

export type LayoutContextPayload = {
  blocks?: Record<string, unknown>
  footer_menu?: LayoutContextFooterMenuItem[]
  site_info?: LayoutContextSiteInfo
}

export type LayoutContextOptions = {
  immediate?: boolean
}

export function layoutContextQuery(path = '/') {
  return { path: path || '/' }
}

export function useLayoutContext(options: LayoutContextOptions = {}) {
  const route = useRoute()
  const path = computed(() => route.path || '/')

  return useFetch<LayoutContextPayload>('/api/layout-blocks', {
    dedupe: 'defer',
    immediate: options.immediate ?? true,
    key: computed(() => `layout-context:${path.value}`),
    query: computed(() => layoutContextQuery(path.value)),
  })
}
