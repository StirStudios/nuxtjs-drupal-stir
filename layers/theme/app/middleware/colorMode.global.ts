import {
  resolveColorModeState,
} from '#stir/utils/colorMode'

export default defineNuxtRouteMiddleware((to) => {
  const colorMode = useColorMode()
  const state = resolveColorModeState(useAppConfig().colorMode, to.path)

  if (state.effectivePreference) {
    colorMode.preference = state.effectivePreference
  }

  if (state.effectivePreference) {
    to.meta.colorMode = state.effectivePreference
    return
  }

  if (state.lockGlobal) return

  delete to.meta.colorMode
})
