export function useAuthConfig() {
  const appConfig = useAppConfig()
  const auth = computed(() => appConfig.auth || {})
  const protectedRoutes = computed(() => appConfig.protectedRoutes || {})

  const loginRedirectPath = computed(
    () => auth.value.loginRedirectPath || '/',
  )
  const logoutRedirectPath = computed(
    () => auth.value.logoutRedirectPath || '/auth/login',
  )
  const protectedFallbackRedirectPath = computed(
    () => auth.value.protectedFallbackRedirectPath || '/',
  )

  return {
    auth,
    protectedRoutes,
    loginRedirectPath,
    logoutRedirectPath,
    protectedFallbackRedirectPath,
  }
}
