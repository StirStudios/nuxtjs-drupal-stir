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

    if (typeof appCfg.enabled === 'boolean') plausible.enabled = appCfg.enabled
    if (typeof appCfg.domain === 'string') plausible.domain = appCfg.domain
  },
})
