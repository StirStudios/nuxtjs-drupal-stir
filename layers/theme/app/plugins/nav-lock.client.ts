import { useNavLock } from '#stir/composables/useNavLock'

export default defineNuxtPlugin((nuxtApp) => {
  const { locked } = useNavLock()

  nuxtApp.hook('page:loading:start', () => {
    locked.value = true
  })
  nuxtApp.hook('page:loading:end', () => {
    locked.value = false
  })
  nuxtApp.hook('app:error', () => {
    locked.value = false
  })
})
