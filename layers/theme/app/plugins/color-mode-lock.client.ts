import {
  resolveColorModeState,
} from '#stir/utils/colorMode'

export default defineNuxtPlugin((nuxtApp) => {
  const colorMode = useColorMode()
  const appConfig = useAppConfig()
  const route = useRoute()

  const applyLockedMode = () => {
    const state = resolveColorModeState(appConfig.colorMode, route.path)

    if (!state.effectivePreference) return
    colorMode.preference = state.effectivePreference
  }

  applyLockedMode()
  nuxtApp.hook('page:start', applyLockedMode)
  nuxtApp.hook('page:finish', applyLockedMode)
})
