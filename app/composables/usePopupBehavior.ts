import { useWindowScroll } from '@vueuse/core'

type PopupBehaviorConfig = {
  trigger: string
  delay?: number
  showOnce?: boolean
  scrollThreshold: number
}

type PopupLike = {
  props?: {
    uuid?: string
  }
}

type PopupBehaviorOptions = {
  popup: Ref<PopupLike | null>
  config: Ref<PopupBehaviorConfig>
  suppress?: Ref<boolean>
  minDelayMs?: number
  cookieKey?: string
}

function normalizePath(path: string): string {
  if (!path || path === '/') return '/'
  return path.endsWith('/') ? path.slice(0, -1) : path
}

function matchesPopupPath(routePath: string, rule: string): boolean {
  const normalizedRule = normalizePath(rule.trim())
  const normalizedRoute = normalizePath(routePath)

  if (!normalizedRule) return false
  if (normalizedRule === '/') return normalizedRoute === '/'
  return (
    normalizedRoute === normalizedRule ||
    normalizedRoute.startsWith(`${normalizedRule}/`)
  )
}

export const usePopupBehavior = ({
  popup,
  config,
  suppress,
  minDelayMs = 3000,
  cookieKey = 'marketing_popup',
}: PopupBehaviorOptions) => {
  const route = useRoute()
  const appConfig = useAppConfig()
  const { y } = useWindowScroll()

  const open = ref(false)
  const seen = useCookie<boolean | undefined>(cookieKey, {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })
  const hasTriggered = ref(false)
  const readyForPopupTriggers = ref(!import.meta.client)
  const isSuppressed = computed(() => suppress?.value === true)

  const includePaths = computed(() =>
    (appConfig.popup?.includePaths ?? []).filter(
      (path): path is string =>
        typeof path === 'string' && path.trim().length > 0,
    ),
  )
  const excludePaths = computed(() =>
    (appConfig.popup?.excludePaths ?? []).filter(
      (path): path is string =>
        typeof path === 'string' && path.trim().length > 0,
    ),
  )
  const isPopupRouteAllowed = computed(() => {
    const routePath = route.path
    const includeMatch =
      includePaths.value.length === 0 ||
      includePaths.value.some((path) => matchesPopupPath(routePath, path))
    const excludeMatch = excludePaths.value.some((path) =>
      matchesPopupPath(routePath, path),
    )

    return includeMatch && !excludeMatch
  })
  const shouldRenderPopupContent = computed(() => open.value)

  let delayTimer: ReturnType<typeof setTimeout> | null = null
  let stopScrollWatch: (() => void) | null = null
  let onExitIntent: ((event: MouseEvent) => void) | null = null
  let idleTimer: ReturnType<typeof setTimeout> | null = null
  let removeReadyListeners: (() => void) | null = null

  const cleanupTriggerHandlers = () => {
    if (delayTimer) {
      clearTimeout(delayTimer)
      delayTimer = null
    }

    if (stopScrollWatch) {
      stopScrollWatch()
      stopScrollWatch = null
    }

    if (onExitIntent && import.meta.client) {
      document.removeEventListener('mouseout', onExitIntent)
      onExitIntent = null
    }
  }

  const cleanupReadyHandlers = () => {
    if (idleTimer) {
      clearTimeout(idleTimer)
      idleTimer = null
    }

    if (removeReadyListeners) {
      removeReadyListeners()
      removeReadyListeners = null
    }
  }

  const markReadyForPopupTriggers = () => {
    if (readyForPopupTriggers.value) return
    readyForPopupTriggers.value = true
    cleanupReadyHandlers()
  }

  const setupReadyForPopupTriggers = () => {
    if (!import.meta.client) return
    if (readyForPopupTriggers.value) return

    const onFirstInteraction = () => {
      markReadyForPopupTriggers()
    }

    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'scroll']

    events.forEach((eventName) => {
      window.addEventListener(eventName, onFirstInteraction, {
        once: true,
        passive: true,
      })
    })

    removeReadyListeners = () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, onFirstInteraction)
      })
    }

    const win = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number
    }

    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(() => {
        markReadyForPopupTriggers()
      }, { timeout: 3000 })
      return
    }

    idleTimer = setTimeout(() => {
      markReadyForPopupTriggers()
    }, 1500)
  }

  const showModalOnce = () => {
    if (isSuppressed.value) return
    if (!isPopupRouteAllowed.value) return
    if (open.value || (config.value.showOnce && seen.value === true)) return

    open.value = true

    if (config.value.showOnce) {
      seen.value = true
    }
  }

  const handleTrigger = () => {
    if (!import.meta.client) return
    if (isSuppressed.value) return
    if (!popup.value) return
    if (!isPopupRouteAllowed.value) return
    if (hasTriggered.value) return

    hasTriggered.value = true

    if (config.value.trigger === 'delay') {
      const safeDelay = Math.max(config.value.delay ?? 0, minDelayMs)

      delayTimer = setTimeout(showModalOnce, safeDelay)
    }

    if (config.value.trigger === 'scroll') {
      stopScrollWatch = watch(
        y,
        (val) => {
          const scrollRoot = document.documentElement
          const scrollable = scrollRoot.scrollHeight - window.innerHeight

          if (scrollable <= 0) return

          const percent = val / scrollable

          if (percent > config.value.scrollThreshold) {
            showModalOnce()
            cleanupTriggerHandlers()
          }
        },
        { immediate: true },
      )
    }

    if (config.value.trigger === 'exit') {
      onExitIntent = (e: MouseEvent) => {
        if (e.clientY <= 0 && !e.relatedTarget) {
          showModalOnce()
          cleanupTriggerHandlers()
        }
      }

      document.addEventListener('mouseout', onExitIntent)
    }
  }

  watch(
    () => popup.value?.props?.uuid,
    () => {
      cleanupTriggerHandlers()
      hasTriggered.value = false
    },
  )

  watch(
    [popup, readyForPopupTriggers, isPopupRouteAllowed, isSuppressed],
    ([popupNode, isReady, isRouteAllowed, suppressed]) => {
      cleanupTriggerHandlers()
      if (popupNode && isReady && isRouteAllowed && !suppressed) {
        handleTrigger()
      }
    },
    { immediate: true },
  )

  watch(
    () => route.path,
    () => {
      hasTriggered.value = false
      cleanupTriggerHandlers()
      if (!isPopupRouteAllowed.value) {
        open.value = false
      }
    },
  )

  watch(isSuppressed, (suppressed) => {
    if (suppressed) {
      open.value = false
      cleanupTriggerHandlers()
    }
  })

  onMounted(() => {
    setupReadyForPopupTriggers()
  })

  onBeforeUnmount(() => {
    cleanupTriggerHandlers()
    cleanupReadyHandlers()
  })

  return {
    open,
    shouldRenderPopupContent,
    isPopupRouteAllowed,
  }
}
