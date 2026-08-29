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
}

const POPUP_DISMISSALS_STORAGE_KEY = 'stir:marketing-popup-dismissals'
const DEFAULT_DISMISSAL_TTL_DAYS = 14
const POPUP_COMPLETED = 'completed'

export type PopupSuppression = number | typeof POPUP_COMPLETED

function popupDismissKey(popup: PopupLike | null): string | null {
  const uuid = popup?.props?.uuid

  if (typeof uuid === 'string' && uuid.trim()) return uuid.trim()

  const id = popup?.props?.id

  return typeof id === 'string' || typeof id === 'number' ? String(id) : null
}

export function popupUsesPersistentDismissal(popup: PopupLike | null): boolean {
  return popupDismissKey(popup) !== null
}

export function popupSuppressionIsActive(
  suppression: PopupSuppression | undefined,
  now = Date.now(),
): boolean {
  return suppression === POPUP_COMPLETED
    || (typeof suppression === 'number' && suppression > now)
}

function readDismissals(now = Date.now()): Record<string, PopupSuppression> {
  if (!import.meta.client) return {}

  try {
    const parsed = JSON.parse(localStorage.getItem(POPUP_DISMISSALS_STORAGE_KEY) || '{}') as Record<string, unknown>

    return Object.fromEntries(Object.entries(parsed).filter(
      (entry): entry is [string, PopupSuppression] => (
        entry[1] === POPUP_COMPLETED
        || (typeof entry[1] === 'number' && entry[1] > now)
      ),
    ))
  }
  catch {
    return {}
  }
}

function writeDismissals(dismissals: Record<string, PopupSuppression>) {
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
  const dismissedPopups = ref<Record<string, PopupSuppression>>({})
  const readyForPopupTriggers = ref(!import.meta.client)
  const popupConfig = computed(() => (appConfig.popup || {}) as PopupAppConfig)
  const dismissalKey = computed(() => popupDismissKey(popup.value))
  const isPersistentlyDismissed = computed(() => {
    if (!dismissalKey.value) return false
    const suppression = dismissedPopups.value[dismissalKey.value]

    return popupSuppressionIsActive(suppression)
  })
  const isSuppressed = computed(() => (
    suppress?.value === true
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
  let closeReason: 'completed' | 'dismissed' | 'suppressed' | null = null

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
    if (dismissedPopups.value[dismissalKey.value] === POPUP_COMPLETED) return

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

  const markPopupCompleted = () => {
    if (!dismissalKey.value) return

    dismissedPopups.value = {
      ...dismissedPopups.value,
      [dismissalKey.value]: POPUP_COMPLETED,
    }
    writeDismissals(dismissedPopups.value)
  }

  const dismissPopup = () => {
    closeReason = 'dismissed'
    open.value = false
  }

  const completePopup = () => {
    closeReason = 'completed'
    open.value = false
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
      if (open.value) closeReason = 'suppressed'
      open.value = false
      cleanupTriggerHandlers()
    }
  })

  watch(open, (value, oldValue) => {
    if (value && !oldValue) closeReason = null

    if (oldValue && !value) {
      if (closeReason === 'completed') {
        markPopupCompleted()
      }
      else if (closeReason !== 'suppressed') {
        markPopupDismissed()
      }

      closeReason = null
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
    completePopup,
    dismissPopup,
    open,
    shouldRenderPopupContent,
  }
}
