import { useEventListener, useScriptTag } from '@vueuse/core'

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

let calendlyScriptLoaded: Promise<Window['Calendly'] | undefined> | null = null

function loadCalendlyScript(
  loadScript: () => Promise<unknown>,
): Promise<Window['Calendly'] | undefined> {
  if (calendlyScriptLoaded) return calendlyScriptLoaded

  calendlyScriptLoaded = new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve(undefined)
    }

    if ('Calendly' in window) {
      return resolve(window.Calendly)
    }

    loadScript()
      .then(() => resolve(window.Calendly))
      .catch(() => {
        if (import.meta.dev) {
          console.error('[Calendly] Failed to load script')
        }
        resolve(undefined)
      })
  })

  return calendlyScriptLoaded
}

function isCalendlyEvent(e: MessageEvent): boolean {
  return (
    typeof e.data?.event === 'string' && e.data.event.startsWith('calendly')
  )
}

export function useCalendlyWidget(
  container: Ref<HTMLElement | null>,
  url: string,
  onReady?: () => void,
) {
  const { load } = useScriptTag(
    'https://assets.calendly.com/assets/external/widget.js',
    undefined,
    {
      manual: true,
      attrs: {
        async: 'true',
        defer: 'true',
      },
    },
  )
  let stopMessageListener: (() => void) | null = null

  onMounted(async () => {
    const calendly = await loadCalendlyScript(load)
    if (!calendly || !container.value) return

    calendly.initInlineWidget({
      url,
      parentElement: container.value,
    })

    onReady?.()

    stopMessageListener = useEventListener(window, 'message', (e: MessageEvent) => {
      if (
        isCalendlyEvent(e) &&
        e.data.event === 'calendly.page_height' &&
        container.value
      ) {
        const height = parseInt(e.data.payload?.height || '', 10)
        if (!isNaN(height)) {
          container.value.style.height = `${height}px`
        }
      }
    })
  })

  onBeforeUnmount(() => {
    stopMessageListener?.()
    stopMessageListener = null
  })
}
