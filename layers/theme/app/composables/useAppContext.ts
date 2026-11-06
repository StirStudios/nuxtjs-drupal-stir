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

export function useAppContext(options: AppContextOptions = {}) {
  const route = useRoute()
  const nuxtApp = useNuxtApp()
  const path = computed(() => route.path || '/')

  const context = useFetch<AppContextPayload>('/api/app-context', {
    dedupe: 'defer',
    immediate: options.immediate ?? true,
    key: computed(() => `app-context:${path.value}`),
    query: computed(() => ({ path: path.value })),
  })

  // Every page asks for app context, so it is how a page Nuxt builds itself
  // (not a Drupal page) learns that Drupal is in Maintenance mode: the whole
  // page then shows the maintenance error, with Drupal's message.
  void context.then(() => {
    const error = context.error.value

    if (error?.statusCode !== 503) return
    // The route's error body carries Drupal's message as data.maintenanceMessage.
    const message = (error.data as { data?: { maintenanceMessage?: unknown } } | undefined)?.data?.maintenanceMessage

    nuxtApp.runWithContext(() => showError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      data: typeof message === 'string' ? { maintenanceMessage: message } : undefined,
    }))
  })

  return context
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
