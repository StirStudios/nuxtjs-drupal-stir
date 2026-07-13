import { useEventListener } from '@vueuse/core'

declare global {
  interface Window {
    Calendly: {
      initInlineWidget(options: {
        url: string
        parentElement: HTMLElement
      }): void
    }
  }
}

const CALENDLY_ORIGIN = 'https://calendly.com'
const CALENDLY_SCRIPT_ORIGIN = 'https://assets.calendly.com'
const CALENDLY_SCRIPT_URL =
  `${CALENDLY_SCRIPT_ORIGIN}/assets/external/widget.js`
const MIN_CALENDLY_HEIGHT = 320
const MAX_CALENDLY_HEIGHT = 2000

export function isCalendlyMessage(event: MessageEvent): boolean {
  return event.origin === CALENDLY_ORIGIN &&
    typeof event.data?.event === 'string' &&
    event.data.event.startsWith('calendly.')
}

export function isCalendlyMessageForContainer(
  event: MessageEvent,
  container: HTMLElement,
): boolean {
  const iframe = container.querySelector<HTMLIFrameElement>('iframe')

  return isCalendlyMessage(event) &&
    Boolean(iframe?.contentWindow) &&
    event.source === iframe?.contentWindow
}

export function resolveCalendlyUrl(value: string): string {
  try {
    const url = new URL(value.trim())

    return url.protocol === 'https:' && url.origin === CALENDLY_ORIGIN
      ? url.toString()
      : ''
  } catch {
    return ''
  }
}

export function resolveCalendlyHeight(value: unknown): number | null {
  const height = typeof value === 'number' ? value : Number.parseInt(String(value), 10)

  if (!Number.isFinite(height)) return null

  return Math.min(
    MAX_CALENDLY_HEIGHT,
    Math.max(MIN_CALENDLY_HEIGHT, Math.round(height)),
  )
}

export function useCalendlyWidget(
  container: Ref<HTMLElement | null>,
  url: string,
  onReady?: () => void,
) {
  const resolvedUrl = resolveCalendlyUrl(url)
  const initialized = ref(false)
  const { isLoaded } = useThirdPartyScript(CALENDLY_SCRIPT_URL, {
    allowedOrigins: [CALENDLY_SCRIPT_ORIGIN],
    isReady: () => typeof window.Calendly?.initInlineWidget === 'function',
  })

  watch(
    [isLoaded, container],
    ([loaded, element]) => {
      if (!loaded || !element || !resolvedUrl || initialized.value) return

      window.Calendly.initInlineWidget({
        url: resolvedUrl,
        parentElement: element,
      })
      initialized.value = true
      onReady?.()
    },
    { flush: 'post', immediate: true },
  )

  if (import.meta.client) {
    useEventListener(window, 'message', (event: MessageEvent) => {
      if (
        !container.value ||
        !isCalendlyMessageForContainer(event, container.value) ||
        event.data.event !== 'calendly.page_height'
      ) {
        return
      }

      const height = resolveCalendlyHeight(event.data.payload?.height)

      if (height !== null) container.value.style.height = `${height}px`
    })
  }
}
