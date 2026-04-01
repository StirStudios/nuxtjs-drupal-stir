import { defineNuxtPlugin, useAppConfig } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return

  const cfg = useAppConfig().analytics?.plausible

  if (process.env.NODE_ENV !== 'production' || !cfg?.enabled || !cfg.domain)
    return
  const scriptBaseUrl = 'https://analytics.stirstudiosdesign.com/js'
  const scriptUrl = cfg.scriptId
    ? `${scriptBaseUrl}/${cfg.scriptId}.js`
    : `${scriptBaseUrl}/script.js`

  type PlausibleQueueFunction = ((
    event: string,
    eventOptions?: Record<string, unknown>,
  ) => void) & {
    init?: (initOptions?: Record<string, unknown>) => void
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
      (event: string, eventOptions?: Record<string, unknown>) => {
        ;(win.plausible!.q ??= []).push([event, eventOptions])
      },
      {
        init: (initOptions?: Record<string, unknown>) => {
          win.plausible!.o = initOptions ?? {}
        },
      },
    )

  // Configure and queue tracking immediately so first pageview is never missed
  // even if script loading is deferred.
  win.plausible.init?.({ autoCapturePageviews: false })
  win.plausible('pageview')
  let isFirstPageFinish = true
  nuxtApp.hook('page:finish', () => {
    if (isFirstPageFinish) {
      isFirstPageFinish = false
      return
    }
    win.plausible?.('pageview')
  })

  const loadPlausible = () =>
    useScript({
      id: 'plausible-script',
      src: scriptUrl,
      async: true,
      defer: true,
      ...(cfg.domain ? { 'data-domain': cfg.domain } : {}),
    })

  const idleApi = globalThis as typeof globalThis & {
    requestIdleCallback?: (callback: IdleRequestCallback) => number
  }

  if (typeof idleApi.requestIdleCallback === 'function') {
    idleApi.requestIdleCallback(() => loadPlausible())
  } else {
    setTimeout(() => loadPlausible(), 1)
  }
})
