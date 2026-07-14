import { defineNuxtPlugin, useAppConfig } from '#app'

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

  const widgetSize = ['small', 'medium', 'large'].includes(String(cfg.size))
    ? (cfg.size as 'small' | 'medium' | 'large')
    : 'small'

  window._userway_config = {
    account: cfg.account,
    position: cfg.position ?? 3,
    size: widgetSize,
    color: cfg.color ?? '#ffffff',
    type: cfg.type ?? '1',
  }

  const configuredDelayMs = Number(cfg.loadDelayMs)
  const loadDelayMs =
    Number.isFinite(configuredDelayMs) && configuredDelayMs >= 0
      ? configuredDelayMs
      : 5000

  useScript(
    {
      id: 'userway-widget',
      src: 'https://cdn.userway.org/widget.js',
      crossorigin: 'anonymous',
      referrerpolicy: 'no-referrer',
    },
    {
      trigger: useScriptTriggerIdleTimeout({ timeout: loadDelayMs }),
    },
  )
})
