import {
  useEventListener,
  useStorage,
  useTimeoutFn,
  useWindowScroll,
} from '@vueuse/core'

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

export type PopupShownPayload = {
  key: string | null
  popup: PopupLike | null
}

declare module '#app' {
  interface RuntimeNuxtHooks {
    'stir:popup:shown': (payload: PopupShownPayload) => void | Promise<void>
  }
}

function popupDismissKey(popup: PopupLike | null): string | null {
  const uuid = popup?.props?.uuid

  if (typeof uuid === 'string' && uuid.trim()) return uuid.trim()

  const id = popup?.props?.id

  return typeof id === 'string' || typeof id === 'number' ? String(id) : null
}

/**
 * Drops entries whose suppression has run out, so storage cannot grow forever.
 */
export function activePopupDismissals(
  dismissals: Record<string, PopupSuppression>,
  now = Date.now(),
): Record<string, PopupSuppression> {
  return Object.fromEntries(
    Object.entries(dismissals).filter(([, suppression]) =>
      popupSuppressionIsActive(suppression, now),
    ),
  )
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
  const nuxtApp = useNuxtApp()
  const route = useRoute()
  const { y } = useWindowScroll()

  const open = ref(false)
  const hasTriggered = ref(false)
  const dismissalReady = ref(!import.meta.client)
  // Written straight through to localStorage, and read only after mount so a
  // server-rendered page and its hydration agree on what is dismissed.
  const dismissedPopups = useStorage<Record<string, PopupSuppression>>(
    POPUP_DISMISSALS_STORAGE_KEY,
    {},
    undefined,
    { initOnMounted: true },
  )
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

  // Every listener and timer below is owned by VueUse, so leaving the scope
  // tears them down; these stops only exist to re-arm a trigger early.
  const stopTriggerHandlers: (() => void)[] = []
  let hasPointerEnteredDocument = false
  let closeReason: 'completed' | 'dismissed' | 'suppressed' | null = null

  const { start: startDelayTrigger, stop: stopDelayTrigger } = useTimeoutFn(
    () => showModalOnce(),
    () => Math.max(config.value.delay ?? 0, minDelayMs),
    { immediate: false },
  )

  const cleanupTriggerHandlers = () => {
    stopDelayTrigger()
    stopTriggerHandlers.splice(0).forEach(stop => stop())
    hasPointerEnteredDocument = false
  }

  const { start: startIdleFallback, stop: stopIdleFallback } = useTimeoutFn(
    () => markReadyForPopupTriggers(),
    1500,
    { immediate: false },
  )
  let stopReadyListeners: (() => void) | null = null

  const markReadyForPopupTriggers = () => {
    if (readyForPopupTriggers.value) return
    readyForPopupTriggers.value = true
    stopIdleFallback()
    stopReadyListeners?.()
    stopReadyListeners = null
  }

  const setupReadyForPopupTriggers = () => {
    if (!import.meta.client) return
    if (readyForPopupTriggers.value) return

    stopReadyListeners = useEventListener(
      window,
      ['pointerdown', 'keydown', 'scroll'],
      () => markReadyForPopupTriggers(),
      { once: true, passive: true },
    )

    const win = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number
    }

    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(() => markReadyForPopupTriggers(), { timeout: 3000 })
      return
    }

    startIdleFallback()
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
      ...activePopupDismissals(dismissedPopups.value),
      [dismissalKey.value]: Date.now() + ttlDays * 24 * 60 * 60 * 1000,
    }
  }

  const markPopupCompleted = () => {
    if (!dismissalKey.value) return

    dismissedPopups.value = {
      ...activePopupDismissals(dismissedPopups.value),
      [dismissalKey.value]: POPUP_COMPLETED,
    }
  }

  const dismissPopup = () => {
    closeReason = 'dismissed'
    open.value = false
  }

  const completePopup = () => {
    closeReason = 'completed'
    open.value = false
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
      stopTriggerHandlers.push(watch(
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
      ))
    }

    if (config.value.trigger === 'exit') {
      const lacksExitIntent = typeof window.matchMedia === 'function'
        && window.matchMedia('(hover: none), (pointer: coarse)').matches

      if (lacksExitIntent) {
        startDelayTrigger()
        return
      }

      stopTriggerHandlers.push(useEventListener(
        document,
        'mousemove',
        () => {
          hasPointerEnteredDocument = true
        },
        { once: true, passive: true },
      ))
      stopTriggerHandlers.push(useEventListener(document, 'mouseout', (e: MouseEvent) => {
        if (hasPointerEnteredDocument && e.clientY <= 0 && !e.relatedTarget) {
          showModalOnce()
          cleanupTriggerHandlers()
        }
      }))
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
    if (value && !oldValue) {
      closeReason = null
      void nuxtApp.callHook('stir:popup:shown', { key: dismissalKey.value, popup: popup.value })
    }

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
    dismissalReady.value = true
    setupReadyForPopupTriggers()
  })

  return {
    completePopup,
    dismissPopup,
    open,
    shouldRenderPopupContent,
  }
}
