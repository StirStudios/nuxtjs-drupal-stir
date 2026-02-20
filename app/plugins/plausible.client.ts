import { defineNuxtPlugin, useRuntimeConfig, useScript } from '#imports'

export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return

  const cfg = useRuntimeConfig().public.plausible
  if (process.env.NODE_ENV !== 'production' || !cfg?.enabled || !cfg.scriptUrl)
    return
  const scriptUrl = cfg.scriptUrl

  type PlausibleQueueFunction = ((
    event: string,
    options?: Record<string, unknown>,
  ) => void) & {
    init?: (options?: Record<string, unknown>) => void
    q?: unknown[]
    o?: Record<string, unknown>
  }

  const win = window as unknown as {
    plausible?: PlausibleQueueFunction
  }

  // Predefine the queue + init API to mirror Plausible's new embed snippet.
  win.plausible =
    win.plausible ??
    Object.assign(
      (event: string, options?: Record<string, unknown>) => {
        ;(win.plausible!.q ??= []).push([event, options])
      },
      {
        init: (options?: Record<string, unknown>) => {
          win.plausible!.o = options ?? {}
        },
      },
    )

  const loadPlausible = () =>
    useScript({
      id: 'plausible-script',
      src: scriptUrl,
      async: true,
      defer: true,
      ...(cfg.domain ? { 'data-domain': cfg.domain } : {}),
    })

  const onScriptLoaded = ({ onLoaded }: ReturnType<typeof loadPlausible>) =>
    onLoaded(() => {
      const plausibleFn = win.plausible

      // Keep explicit SPA tracking to avoid duplicate pageviews from auto capture.
      plausibleFn?.init?.({ autoCapturePageviews: false })
      plausibleFn?.('pageview')
      nuxtApp.hook('page:finish', () => {
        plausibleFn?.('pageview')
      })
    })

  const idleApi = globalThis as typeof globalThis & {
    requestIdleCallback?: (callback: IdleRequestCallback) => number
  }

  if (typeof idleApi.requestIdleCallback === 'function') {
    idleApi.requestIdleCallback(() => onScriptLoaded(loadPlausible()))
  } else {
    setTimeout(() => onScriptLoaded(loadPlausible()), 1)
  }
})
