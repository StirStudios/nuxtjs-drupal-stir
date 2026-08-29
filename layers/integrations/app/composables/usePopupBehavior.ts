import { useWindowScroll } from '@vueuse/core'

type PopupBehaviorConfig = {
  trigger: string
  delay?: number
  scrollThreshold: number
}

type PopupLike = {
  props?: {
    id?: string | number
    uuid?: string
  }
}

type PopupAppConfig = {
  dismissalTtlDays?: number
  suppressedPaths?: string[]
  suppressedPathPrefixes?: string[]
}

const POPUP_DISMISSALS_STORAGE_KEY = 'stir:marketing-popup-dismissals'
const DEFAULT_DISMISSAL_TTL_DAYS = 30

export function popupRouteIsSuppressed(
  path: string,
  suppressedPaths: string[] = [],
  suppressedPathPrefixes: string[] = [],
): boolean {
  const normalizedPath = normalizePopupPath(path)

  if (suppressedPaths.some(candidate => normalizePopupPath(candidate) === normalizedPath)) {
    return true
  }

  return suppressedPathPrefixes.some((candidate) => {
    const prefix = normalizePopupPath(candidate)

    return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  })
}

function normalizePopupPath(path: string): string {
  if (!path || path === '/') return '/'

  return `/${path.replace(/^\/+|\/+$/g, '')}`
}

function popupDismissKey(popup: PopupLike | null): string | null {
  const uuid = popup?.props?.uuid

  if (typeof uuid === 'string' && uuid.trim()) return uuid.trim()

  const id = popup?.props?.id

  return typeof id === 'string' || typeof id === 'number' ? String(id) : null
}

export function popupUsesPersistentDismissal(popup: PopupLike | null): boolean {
  return popupDismissKey(popup) !== null
}

function readDismissals(now = Date.now()): Record<string, number> {
  if (!import.meta.client) return {}

  try {
    const parsed = JSON.parse(localStorage.getItem(POPUP_DISMISSALS_STORAGE_KEY) || '{}') as Record<string, unknown>

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, number] => (
        typeof entry[1] === 'number' && entry[1] > now
      )),
    )
  }
  catch {
    return {}
  }
}

function writeDismissals(dismissals: Record<string, number>) {
  if (!import.meta.client) return

  try {
    localStorage.setItem(POPUP_DISMISSALS_STORAGE_KEY, JSON.stringify(dismissals))
  }
  catch {
    // Storage can be unavailable in restricted browsing contexts.
  }
}

type PopupBehaviorOptions = {
  popup: Ref<PopupLike | null>
  config: Ref<PopupBehaviorConfig>
  suppress?: Ref<boolean>
  minDelayMs?: number
}

export const usePopupBehavior = ({
  popup,
  config,
  suppress,
  minDelayMs = 3000,
}: PopupBehaviorOptions) => {
  const appConfig = useAppConfig()
  const route = useRoute()
  const { y } = useWindowScroll()

  const open = ref(false)
  const hasTriggered = ref(false)
  const dismissalReady = ref(!import.meta.client)
  const dismissedPopups = ref<Record<string, number>>({})
  const readyForPopupTriggers = ref(!import.meta.client)
  const popupConfig = computed(() => (appConfig.popup || {}) as PopupAppConfig)
  const dismissalKey = computed(() => popupDismissKey(popup.value))
  const isPersistentlyDismissed = computed(() => {
    if (!dismissalKey.value) return false
    return (dismissedPopups.value[dismissalKey.value] || 0) > Date.now()
  })
  const isRouteSuppressed = computed(() => popupRouteIsSuppressed(
    route.path,
    popupConfig.value.suppressedPaths,
    popupConfig.value.suppressedPathPrefixes,
  ))
  const isSuppressed = computed(() => (
    suppress?.value === true
    || isRouteSuppressed.value
    || isPersistentlyDismissed.value
    || (popupUsesPersistentDismissal(popup.value) && !dismissalReady.value)
  ))
  const shouldRenderPopupContent = computed(() => open.value)

  let delayTimer: ReturnType<typeof setTimeout> | null = null
  let stopScrollWatch: (() => void) | null = null
  let onExitIntent: ((event: MouseEvent) => void) | null = null
  let onPointerEnteredDocument: (() => void) | null = null
  let hasPointerEnteredDocument = false
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

    if (onPointerEnteredDocument && import.meta.client) {
      document.removeEventListener('mousemove', onPointerEnteredDocument)
      onPointerEnteredDocument = null
    }

    hasPointerEnteredDocument = false
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
    if (open.value) return

    open.value = true
  }

  const markPopupDismissed = () => {
    if (!dismissalKey.value) return

    const configuredDays = popupConfig.value.dismissalTtlDays
    const ttlDays = typeof configuredDays === 'number' && configuredDays > 0
      ? configuredDays
      : DEFAULT_DISMISSAL_TTL_DAYS

    dismissedPopups.value = {
      ...dismissedPopups.value,
      [dismissalKey.value]: Date.now() + ttlDays * 24 * 60 * 60 * 1000,
    }
    writeDismissals(dismissedPopups.value)
  }

  const startDelayTrigger = () => {
    const safeDelay = Math.max(config.value.delay ?? 0, minDelayMs)

    delayTimer = setTimeout(showModalOnce, safeDelay)
  }

  const handleTrigger = () => {
    if (!import.meta.client) return
    if (isSuppressed.value) return
    if (!popup.value) return
    if (hasTriggered.value) return

    hasTriggered.value = true

    if (config.value.trigger === 'delay') {
      startDelayTrigger()
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
      const lacksExitIntent = typeof window.matchMedia === 'function'
        && window.matchMedia('(hover: none), (pointer: coarse)').matches

      if (lacksExitIntent) {
        startDelayTrigger()
        return
      }

      onPointerEnteredDocument = () => {
        hasPointerEnteredDocument = true
      }

      onExitIntent = (e: MouseEvent) => {
        if (hasPointerEnteredDocument && e.clientY <= 0 && !e.relatedTarget) {
          showModalOnce()
          cleanupTriggerHandlers()
        }
      }

      document.addEventListener('mousemove', onPointerEnteredDocument, { once: true, passive: true })
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

  // Re-arm popup triggers when popup content/config changes without UUID changes
  // (e.g. schedule edits on nested items in the same popup paragraph).
  watch(
    () => ({
      popup: popup.value,
      config: config.value,
    }),
    () => {
      cleanupTriggerHandlers()
      hasTriggered.value = false
      if (isSuppressed.value) {
        open.value = false
      }
    },
    { deep: true },
  )

  watch(
    [popup, readyForPopupTriggers, isSuppressed],
    ([popupNode, isReady, suppressed]) => {
      cleanupTriggerHandlers()
      if (popupNode && isReady && !suppressed) {
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
    },
  )

  watch(isSuppressed, (suppressed) => {
    if (suppressed) {
      open.value = false
      cleanupTriggerHandlers()
    }
  })

  watch(open, (value, oldValue) => {
    if (oldValue && !value) {
      markPopupDismissed()
    }
  })

  onMounted(() => {
    dismissedPopups.value = readDismissals()
    dismissalReady.value = true
    setupReadyForPopupTriggers()
  })

  onBeforeUnmount(() => {
    cleanupTriggerHandlers()
    cleanupReadyHandlers()
  })

  return {
    open,
    shouldRenderPopupContent,
  }
}
