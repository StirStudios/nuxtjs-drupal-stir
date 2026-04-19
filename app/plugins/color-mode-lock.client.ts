import { defineNuxtPlugin, useAppConfig } from '#app'
import {
  normalizeColorModePreference,
  shouldLockGlobalColorMode,
} from '~/utils/colorMode'

export default defineNuxtPlugin((nuxtApp) => {
  const colorMode = useColorMode()
  const appConfig = useAppConfig()

  const applyLockedMode = () => {
    const { preference } = appConfig.colorMode

    // Global lock policy only. Route-level overrides are handled in middleware.
    if (!shouldLockGlobalColorMode(appConfig.colorMode)) return

    colorMode.preference = normalizeColorModePreference(preference)
  }

  applyLockedMode()
  nuxtApp.hook('page:start', applyLockedMode)
  nuxtApp.hook('page:finish', applyLockedMode)
})
