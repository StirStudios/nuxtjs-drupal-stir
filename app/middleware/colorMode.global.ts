import { defineNuxtRouteMiddleware, useAppConfig } from '#app'
import {
  resolveColorModeState,
} from '~/utils/colorMode'

export default defineNuxtRouteMiddleware((to) => {
  const colorMode = useColorMode()
  const state = resolveColorModeState(useAppConfig().colorMode, to.path)

  if (state.effectivePreference) {
    colorMode.preference = state.effectivePreference
  }

  if (state.routeOverride) {
    to.meta.colorMode = state.routeOverride
    return
  }

  if (state.lockGlobal) return

  delete to.meta.colorMode
})
