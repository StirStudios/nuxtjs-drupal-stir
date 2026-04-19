import { defineNuxtRouteMiddleware, useAppConfig } from '#app'
import {
  getRouteColorModeOverride,
  normalizeColorModePreference,
  shouldLockGlobalColorMode,
} from '~/utils/colorMode'

export default defineNuxtRouteMiddleware((to) => {
  const colorMode = useColorMode()
  const {
    forced = false,
    preference,
    showToggle = true,
    lightRoutes = [],
    darkRoutes = [],
  } = useAppConfig().colorMode
  const normalizedPreference = normalizeColorModePreference(preference)

  // `forced` is a hard global lock. Route overrides apply only when not forced.
  if (forced) {
    colorMode.preference = normalizedPreference
    return
  }

  const routeOverride = getRouteColorModeOverride({
    path: to.path,
    lightRoutes,
    darkRoutes,
  })

  // If toggle is hidden, keep baseline mode deterministic across app reloads
  // regardless of any previously persisted user choice.
  if (routeOverride) {
    colorMode.preference = routeOverride
  } else if (shouldLockGlobalColorMode({ forced, showToggle })) {
    colorMode.preference = normalizedPreference
  }

  if (routeOverride) {
    to.meta.colorMode = routeOverride
    return
  }

  // Do not write route meta for global lock mode. Route meta forcing is
  // reserved for explicit route overrides (lightRoutes/darkRoutes) only.
  if (!showToggle) return

  delete to.meta.colorMode
})
