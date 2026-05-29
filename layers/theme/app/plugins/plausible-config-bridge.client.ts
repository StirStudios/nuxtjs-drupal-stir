import { defineNuxtPlugin, useAppConfig, useRuntimeConfig } from '#app'

type PlausibleRuntimeConfig = {
  enabled?: boolean
  domain?: string
}

export default defineNuxtPlugin({
  name: 'plausible-config-bridge',
  enforce: 'pre',
  setup() {
    if (!import.meta.client) return

    const appCfg = useAppConfig().analytics?.plausible as PlausibleRuntimeConfig | undefined

    if (!appCfg) return

    const runtimeCfg = useRuntimeConfig()
    const plausible = runtimeCfg.public.plausible as PlausibleRuntimeConfig

    if (appCfg.enabled === false) plausible.enabled = false
    if (appCfg.domain) plausible.domain = appCfg.domain
  },
})
