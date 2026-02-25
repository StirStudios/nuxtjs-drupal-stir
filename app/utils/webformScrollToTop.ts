import type { Ref } from 'vue'

export type WebformScrollConfig = {
  scrollToTopOnSuccess: boolean
  scrollToTopOnReset: boolean
  scrollToTopDelayMs: number
  scrollToTopFallbackDelayMs: number
}

type ScrollToWindow = {
  scrollTo: (options: ScrollToOptions) => void
}

const toNonNegativeNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) return fallback

  return Math.max(0, parsed)
}

export const getWebformScrollConfig = (
  themeWebform: Record<string, unknown> | undefined,
): WebformScrollConfig => ({
  scrollToTopOnSuccess: themeWebform?.scrollToTopOnSuccess !== false,
  scrollToTopOnReset: themeWebform?.scrollToTopOnReset !== false,
  scrollToTopDelayMs: toNonNegativeNumber(themeWebform?.scrollToTopDelayMs, 0),
  scrollToTopFallbackDelayMs: toNonNegativeNumber(
    themeWebform?.scrollToTopFallbackDelayMs,
    180,
  ),
})

export const createScrollToTopRunner = ({
  y,
  getDelayMs,
  getFallbackDelayMs,
  getWindow = () => (typeof window !== 'undefined' ? window : undefined),
}: {
  y: Ref<number>
  getDelayMs: () => number
  getFallbackDelayMs: () => number
  getWindow?: () => ScrollToWindow | undefined
}) => {
  let primaryTimer: ReturnType<typeof setTimeout> | undefined
  let fallbackTimer: ReturnType<typeof setTimeout> | undefined

  const cleanup = () => {
    if (primaryTimer !== undefined) {
      clearTimeout(primaryTimer)
      primaryTimer = undefined
    }

    if (fallbackTimer !== undefined) {
      clearTimeout(fallbackTimer)
      fallbackTimer = undefined
    }
  }

  const run = () => {
    const targetWindow = getWindow()

    if (!targetWindow) return

    cleanup()

    const delayMs = getDelayMs()
    const fallbackDelayMs = getFallbackDelayMs()

    const applyPrimary = () => {
      y.value = 0
      primaryTimer = undefined
    }

    const applyFallback = () => {
      targetWindow.scrollTo({ top: 0, behavior: 'auto' })
      fallbackTimer = undefined
    }

    if (delayMs > 0) {
      primaryTimer = setTimeout(applyPrimary, delayMs)
    } else {
      applyPrimary()
    }

    if (fallbackDelayMs > 0) {
      fallbackTimer = setTimeout(applyFallback, delayMs + fallbackDelayMs)
    }
  }

  return { run, cleanup }
}
