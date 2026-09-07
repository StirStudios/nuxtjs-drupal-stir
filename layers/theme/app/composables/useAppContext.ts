import type { MaybeRefOrGetter } from 'vue'
import type {
  AppContextBlock,
  AppContextPayload,
} from '../../../core/shared/types/appContext'

export type {
  AppContextBlock,
  AppContextFooterMenuItem,
  AppContextPayload,
  AppContextSiteInfo,
} from '../../../core/shared/types/appContext'

export type AppContextOptions = {
  immediate?: boolean
}

export type AppFooterContextPayload = Pick<
  AppContextPayload,
  'footer_menu' | 'site_info'
>

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

function selectAppContext<T>(
  options: AppContextOptions,
  select: (payload: AppContextPayload) => T,
) {
  const context = useAppContext(options)
  const data = computed(() => context.data.value ? select(context.data.value) : undefined)
  const result = {
    data,
    pending: context.pending,
    error: context.error,
    status: context.status,
    execute: context.execute,
    refresh: context.refresh,
    clear: context.clear,
  }

  return Object.assign(context.then(() => result), result)
}

export function useAppFooterContext(options: AppContextOptions = {}) {
  return selectAppContext<AppFooterContextPayload>(options, payload => ({
    footer_menu: payload.footer_menu,
    site_info: payload.site_info,
  }))
}

export function useAppRegionBlocks(area: MaybeRefOrGetter<string>, options: AppContextOptions = {}) {
  return selectAppContext<AppContextBlock[]>(options, payload => payload.blocks[toValue(area)] ?? [])
}
