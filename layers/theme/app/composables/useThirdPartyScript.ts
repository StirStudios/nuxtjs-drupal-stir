import type { MaybeRefOrGetter } from 'vue'
import { useOptionalScriptConsent } from './useOptionalScriptConsent'

export type ThirdPartyScriptKind = 'calculator' | 'enzuzo'

type ThirdPartyScriptOptions = {
  allowedOrigins?: MaybeRefOrGetter<readonly string[] | undefined>
  attrs?: Record<string, string>
  /**
   * Set to false for a host that answers every request with one fixed
   * `Access-Control-Allow-Origin`. `useScript` adds `crossorigin="anonymous"`
   * to every cross-origin script, which makes the browser enforce CORS and
   * block the response. Without the attribute the script loads as an ordinary
   * no-CORS script. Leave unset to keep the stricter default.
   */
  crossorigin?: false
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

/**
 * An entry is an exact origin (`https://app.enzuzo.com`) or a subdomain
 * wildcard (`https://*.piperavenue.com`). A wildcard matches any subdomain on
 * the default HTTPS port, at a dot boundary, but not the bare domain.
 */
function allowsScriptOrigin(entry: string, url: URL): boolean {
  const wildcard = /^https:\/\/\*\.([a-z0-9-]+(?:\.[a-z0-9-]+)+)$/i.exec(entry.trim())

  if (wildcard) {
    return url.port === '' && url.hostname.endsWith(`.${wildcard[1]!.toLowerCase()}`)
  }
  return normalizeScriptOrigin(entry) === url.origin
}

export function resolveAllowedScriptUrl(
  value: string,
  allowedOrigins: readonly string[],
): string {
  const raw = value.trim()

  if (!raw) return ''

  try {
    const url = new URL(raw.startsWith('//') ? `https:${raw}` : raw)

    if (url.protocol !== 'https:' || !allowedOrigins.some(entry => allowsScriptOrigin(entry, url))) {
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

  if (import.meta.dev) {
    watch(
      () => [toValue(src).trim(), safeSrc.value] as const,
      ([raw, allowed]) => {
        if (raw && !allowed) {
          console.warn(
            `[useThirdPartyScript] Refused ${options.kind || 'script'} URL ${raw}: `
            + 'its origin is not HTTPS or not in thirdPartyScripts.allowedOrigins.',
          )
        }
      },
      { immediate: true },
    )
  }
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
          // unhead types this attribute as its CORS values only, but its DOM
          // renderer skips any prop set to false. That is the only way to stop
          // it defaulting a cross-origin script to crossorigin="anonymous".
          ...(options.crossorigin === false
            ? { crossorigin: false as unknown as 'anonymous' }
            : {}),
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
