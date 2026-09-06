import type { MaybeRefOrGetter } from 'vue'
import { useOptionalScriptConsent } from './useOptionalScriptConsent'

export type ThirdPartyScriptKind = 'calculator' | 'enzuzo'

type ThirdPartyScriptOptions = {
  allowedOrigins?: MaybeRefOrGetter<readonly string[] | undefined>
  attrs?: Record<string, string>
  id?: string
  immediate?: boolean
  isReady?: () => boolean
  kind?: ThirdPartyScriptKind
  requiresConsent?: boolean
}

export function normalizeScriptOrigin(value: string): string {
  try {
    const url = new URL(value)

    if (url.protocol !== 'https:') return ''
    return url.origin
  } catch {
    return ''
  }
}

export function resolveAllowedScriptUrl(
  value: string,
  allowedOrigins: readonly string[],
): string {
  const raw = value.trim()

  if (!raw) return ''

  try {
    const url = new URL(raw.startsWith('//') ? `https:${raw}` : raw)
    const normalizedOrigins = new Set(
      allowedOrigins.map(normalizeScriptOrigin).filter(Boolean),
    )

    if (url.protocol !== 'https:' || !normalizedOrigins.has(url.origin)) {
      return ''
    }

    return url.toString()
  } catch {
    return ''
  }
}

export function useThirdPartyScript(
  src: MaybeRefOrGetter<string>,
  options: ThirdPartyScriptOptions = {},
) {
  const appConfig = useAppConfig()
  const nuxtApp = useNuxtApp()
  const requestVersion = ref(0)
  const { allowsNonEssential } = useOptionalScriptConsent()
  const isMounted = ref(false)
  const isRequested = ref(options.immediate !== false)
  const isLoaded = ref(false)
  const error = shallowRef<Error | null>(null)
  const configuredOrigins = computed<readonly string[]>(() => {
    if (options.allowedOrigins) return toValue(options.allowedOrigins) || []
    if (!options.kind) return []

    return appConfig.thirdPartyScripts?.allowedOrigins?.[options.kind] || []
  })
  const safeSrc = computed(() =>
    resolveAllowedScriptUrl(toValue(src), configuredOrigins.value),
  )
  const canLoad = computed(() =>
    Boolean(
      import.meta.client &&
      isMounted.value &&
      isRequested.value &&
      (options.requiresConsent === false || allowsNonEssential.value) &&
      safeSrc.value,
    ),
  )

  onMounted(() => {
    isMounted.value = true
  })

  function requestLoad(): void {
    isRequested.value = true
    requestVersion.value += 1
  }

  watch(
    [canLoad, safeSrc, requestVersion],
    async ([allowed, url], _previous, onCleanup) => {
      let current = true

      onCleanup(() => { current = false })
      isLoaded.value = false
      error.value = null
      if (!allowed) return
      if (options.isReady?.()) {
        isLoaded.value = true
        return
      }

      try {
        const script = await nuxtApp.runWithContext(() => useScript({
          ...options.attrs,
          src: url,
          id: options.id,
          defer: true,
          'data-stir-script': options.kind || 'trusted',
        }, { trigger: 'manual', warmupStrategy: false }))

        if (!current) return
        await (script.status.value === 'error' ? script.reload() : script.load())
        if (script.status.value !== 'loaded') throw new Error('third_party_script_failed')
        if (current) isLoaded.value = true
      } catch (caught) {
        if (current) {
          error.value = caught instanceof Error
            ? caught
            : new Error('third_party_script_failed')
        }
      }
    },
    { immediate: true },
  )

  return {
    canLoad,
    error,
    isLoaded,
    requestLoad,
    safeSrc,
  }
}
