import { defineNuxtPlugin, useAppConfig, useScript } from '#imports'

declare global {
  interface Window {
    _userway_config?: {
      account: string
      position?: number
      size?: 'small' | 'medium' | 'large'
      color?: string
      type?: string
      [key: string]: unknown
    }
  }
}

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  const cfg = useAppConfig().userway ?? {}

  if (!cfg.enabled || !cfg.account) return
  if (document.getElementById('userway-widget')) return

  window._userway_config = {
    account: cfg.account,
    position: cfg.position ?? 3,
    size: cfg.size ?? 'small',
    color: cfg.color ?? '#ffffff',
    type: cfg.type ?? '1',
  }

  const loadUserway = () =>
    useScript({
      id: 'userway-widget',
      src: 'https://cdn.userway.org/widget.js',
      crossorigin: 'anonymous',
      referrerpolicy: 'no-referrer',
    })

  const idleApi = globalThis as typeof globalThis & {
    requestIdleCallback?: (callback: IdleRequestCallback) => number
  }

  if (typeof idleApi.requestIdleCallback === 'function') {
    idleApi.requestIdleCallback(() => loadUserway())
  } else {
    setTimeout(() => loadUserway(), 1)
  }
})
