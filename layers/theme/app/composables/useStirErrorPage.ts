import type { NuxtError } from '#app'
import type { MaybeRefOrGetter } from 'vue'

export type StirErrorKind = 'notFound' | 'maintenance' | 'backend' | 'generic'

type ErrorCopy = { title?: string, message?: string }

const DEFAULT_COPY: Record<Exclude<StirErrorKind, 'generic'>, Required<ErrorCopy>> = {
  notFound: {
    title: 'Page not found',
    message: 'The page you are looking for does not exist.',
  },
  maintenance: {
    title: 'Back shortly',
    message: 'We are making some improvements. Please check back in a few minutes.',
  },
  backend: {
    title: 'Content service unavailable',
    message: 'We cannot reach the CMS right now. Please try again later.',
  },
}

/**
 * What an error page should say, for the layer's error.vue and any project
 * that replaces it with its own design.
 *
 * Drupal answers 503 while its Maintenance mode is on, so a 503 is planned
 * maintenance and shows Drupal's own maintenance message (passed on by the
 * page fetch as `error.data.maintenanceMessage`). 502 and 504 are the backend
 * failing. Each kind's title and message can be set under `stirTheme.error`
 * (`notFound`, `maintenance`, `backend`, `generic`); a generic error
 * otherwise keeps its own status message. Sets `Retry-After` on maintenance.
 */
export function useStirErrorPage(error: MaybeRefOrGetter<NuxtError | null | undefined>) {
  const config = useAppConfig().stirTheme?.error ?? {}

  const statusCode = computed(() => toValue(error)?.statusCode ?? 500)
  const kind = computed<StirErrorKind>(() => {
    if (statusCode.value === 404) return 'notFound'
    if (statusCode.value === 503) return 'maintenance'
    if ([502, 504].includes(statusCode.value)) return 'backend'

    return 'generic'
  })

  const drupalMaintenanceMessage = computed(() => {
    const data = toValue(error)?.data as { maintenanceMessage?: unknown } | undefined

    return typeof data?.maintenanceMessage === 'string' ? data.maintenanceMessage.trim() : ''
  })

  const title = computed(() => {
    const configured = (config[kind.value] as ErrorCopy | undefined)?.title

    if (kind.value === 'generic') {
      return configured || toValue(error)?.statusMessage || 'Something went wrong'
    }

    return configured || DEFAULT_COPY[kind.value].title
  })
  const message = computed(() => {
    const configured = (config[kind.value] as ErrorCopy | undefined)?.message

    if (kind.value === 'maintenance') {
      return drupalMaintenanceMessage.value || configured || DEFAULT_COPY.maintenance.message
    }
    if (kind.value === 'generic') {
      return configured || toValue(error)?.message || 'Please try again.'
    }

    return configured || DEFAULT_COPY[kind.value].message
  })

  if (import.meta.server && kind.value === 'maintenance') {
    useResponseHeader('Retry-After').value = String(config.maintenance?.retryAfter ?? 300)
  }

  return {
    statusCode,
    kind,
    isNotFound: computed(() => kind.value === 'notFound'),
    isMaintenance: computed(() => kind.value === 'maintenance'),
    isBackendError: computed(() => kind.value === 'backend'),
    title,
    message,
  }
}
