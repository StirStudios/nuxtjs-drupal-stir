let navHooksRegistered = false

export function useNavLock() {
  const nuxtApp = useNuxtApp()
  const locked = useState<boolean>('nav-locked', () => false)

  if (import.meta.client && !navHooksRegistered) {
    navHooksRegistered = true
    nuxtApp.hook('page:start', () => {
      locked.value = true
    })
    nuxtApp.hook('page:finish', () => {
      locked.value = false
    })
    nuxtApp.hook('app:error', () => {
      locked.value = false
    })
  }
  return { locked }
}
