import { useNavLock } from '#stir/composables/useNavLock'

export default defineNuxtPlugin((nuxtApp) => {
  const { locked } = useNavLock()

  nuxtApp.hook('page:start', () => {
    locked.value = true
  })
  nuxtApp.hook('page:finish', () => {
    locked.value = false
  })
  nuxtApp.hook('app:error', () => {
    locked.value = false
  })
})
