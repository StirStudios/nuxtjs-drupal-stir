let navHooksRegistered = false

export function useNavLock() {
  const nuxtApp = useNuxtApp()
  const route = useRoute()
  const locked = useState<boolean>('nav-locked', () => false)
  const routeWatchInitialized = useState<boolean>('nav-lock-route-watch-initialized', () => false)

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

  if (import.meta.client) {
    watch(
      () => route.fullPath,
      () => {
        if (!routeWatchInitialized.value) {
          routeWatchInitialized.value = true
        } else {
          locked.value = true
        }
      },
      { immediate: true, flush: 'sync' },
    )
  }
  return { locked }
}
