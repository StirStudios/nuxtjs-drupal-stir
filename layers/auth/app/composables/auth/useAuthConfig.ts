export function useAuthConfig() {
  const appConfig = useAppConfig()
  const auth = computed(() => appConfig.auth || {})
  const protectedRoutes = computed(() => appConfig.protectedRoutes || {})

  const loginRedirectPath = computed(
    () => auth.value.loginRedirectPath || '/',
  )
  const protectedFallbackRedirectPath = computed(
    () => auth.value.protectedFallbackRedirectPath || '/',
  )
  const accountEnabled = computed(() => auth.value.accountEnabled !== false)
  const logoutRedirectPath = computed(() => {
    const path = auth.value.logoutRedirectPath

    if (!accountEnabled.value && (!path || path === '/auth/login')) {
      return protectedFallbackRedirectPath.value
    }

    return path || '/auth/login'
  })

  return {
    auth,
    protectedRoutes,
    accountEnabled,
    loginRedirectPath,
    logoutRedirectPath,
    protectedFallbackRedirectPath,
  }
}
