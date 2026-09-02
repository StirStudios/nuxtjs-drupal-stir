import { useNavLock } from '#stir/composables/useNavLock'

export default defineNuxtPlugin((nuxtApp) => {
  const { locked } = useNavLock()
  const pendingNavigations = useState<number>('nav-lock-pending-count', () => 0)

  nuxtApp.hook('page:loading:start', () => {
    pendingNavigations.value += 1
    locked.value = true
  })
  nuxtApp.hook('page:loading:end', () => {
    pendingNavigations.value = Math.max(0, pendingNavigations.value - 1)
    locked.value = pendingNavigations.value > 0
  })
  nuxtApp.hook('app:error', () => {
    pendingNavigations.value = 0
    locked.value = false
  })
})
