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

const scriptPromises = new Map<string, Promise<HTMLScriptElement>>()

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

function findExistingScript(src: string): HTMLScriptElement | undefined {
  return Array.from(document.scripts).find((script) => script.src === src)
}

function loadScript(
  src: string,
  options: ThirdPartyScriptOptions,
): Promise<HTMLScriptElement> {
  const pending = scriptPromises.get(src)

  if (pending) return pending

  const promise = new Promise<HTMLScriptElement>((resolve, reject) => {
    const existing = findExistingScript(src)
    const script = existing || document.createElement('script')

    if (options.isReady?.() || script.dataset.stirLoaded === 'true') {
      resolve(script)
      return
    }

    script.addEventListener(
      'load',
      () => {
        script.dataset.stirLoaded = 'true'
        resolve(script)
      },
      { once: true },
    )
    script.addEventListener(
      'error',
      () => reject(new Error('third_party_script_failed')),
      { once: true },
    )

    if (existing) return

    script.src = src
    script.defer = true
    script.dataset.stirScript = options.kind || 'trusted'

    if (options.id) script.id = options.id
    Object.entries(options.attrs || {}).forEach(([name, value]) => {
      script.setAttribute(name, value)
    })

    document.head.appendChild(script)
  })

  scriptPromises.set(src, promise)
  promise.catch(() => scriptPromises.delete(src))
  return promise
}

export function useThirdPartyScript(
  src: MaybeRefOrGetter<string>,
  options: ThirdPartyScriptOptions = {},
) {
  const appConfig = useAppConfig()
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
  }

  watch(
    canLoad,
    async (allowed) => {
      if (!allowed || isLoaded.value) return

      try {
        await loadScript(safeSrc.value, options)
        isLoaded.value = true
      } catch (caught) {
        error.value = caught instanceof Error
          ? caught
          : new Error('third_party_script_failed')
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
