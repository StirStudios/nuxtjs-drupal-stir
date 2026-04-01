import { defineNuxtPlugin, useAppConfig, useRuntimeConfig } from '#app'

type PlausibleRuntimeConfig = {
  enabled?: boolean
  domain?: string
  apiHost?: string
  autoPageviews?: boolean
  hashMode?: boolean
  proxy?: boolean
  proxyBaseEndpoint?: string
  ignoredHostnames?: string[]
  ignoreSubDomains?: boolean
  autoOutboundTracking?: boolean
  fileDownloads?: boolean | { fileExtensions: string[] }
  formSubmissions?: boolean
  logIgnoredEvents?: boolean
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
    if (typeof appCfg.apiHost === 'string') plausible.apiHost = appCfg.apiHost
    if (typeof appCfg.autoPageviews === 'boolean')
      plausible.autoPageviews = appCfg.autoPageviews
    if (typeof appCfg.hashMode === 'boolean') plausible.hashMode = appCfg.hashMode
    if (typeof appCfg.proxy === 'boolean') plausible.proxy = appCfg.proxy
    if (typeof appCfg.proxyBaseEndpoint === 'string')
      plausible.proxyBaseEndpoint = appCfg.proxyBaseEndpoint
    if (Array.isArray(appCfg.ignoredHostnames))
      plausible.ignoredHostnames = appCfg.ignoredHostnames
    if (typeof appCfg.ignoreSubDomains === 'boolean')
      plausible.ignoreSubDomains = appCfg.ignoreSubDomains
    if (typeof appCfg.autoOutboundTracking === 'boolean')
      plausible.autoOutboundTracking = appCfg.autoOutboundTracking
    if (typeof appCfg.fileDownloads === 'boolean' || typeof appCfg.fileDownloads === 'object')
      plausible.fileDownloads = appCfg.fileDownloads
    if (typeof appCfg.formSubmissions === 'boolean')
      plausible.formSubmissions = appCfg.formSubmissions
    if (typeof appCfg.logIgnoredEvents === 'boolean')
      plausible.logIgnoredEvents = appCfg.logIgnoredEvents
  },
})
