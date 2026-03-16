export function usePasswordLogin() {
  const config = useAppConfig().protectedRoutes
  const heading = computed(() => config?.loginHeading || 'Login')
  const toast = useToast()
  const isLoading = ref(false)
  const showLogin = ref(false)
  const state = reactive({ password: '' })
  const validate = (formState: typeof state) => {
    const errors: { id?: string; name?: string; message: string }[] = []

    if (!formState.password) {
      errors.push({
        name: 'password',
        id: 'password',
        message: 'Password is required',
      })
    }
    return errors
  }
  const session = useUserSession()
  const { onError } = useValidation()
  const route = useRoute()
  const router = useRouter()
  const onSubmit = async (event: { data: typeof state }) => {
    isLoading.value = true
    try {
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: { password: event.data.password },
      })

      await session.fetch()

      if (session.loggedIn.value) {
        toast.add({
          title: 'Success',
          description: 'Access granted!',
          color: 'success',
        })
        navigateTo(config?.redirectOnLogin || '/')
      } else {
        toast.add({
          title: 'Session error',
          description: 'Login succeeded but session not active',
          color: 'warning',
        })
      }
    } catch {
      toast.add({
        title: 'Error',
        description: 'Incorrect password',
        color: 'error',
      })
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    if (import.meta.server) return

    const passwordFromUrl = route.query.password

    if (typeof passwordFromUrl === 'string') {
      state.password = passwordFromUrl
      onSubmit({ data: { password: passwordFromUrl } })

      const { password, ...cleanedQuery } = route.query

      router.replace({ query: cleanedQuery })
    }
  })

  return {
    heading,
    state,
    validate,
    onSubmit,
    onError,
    isLoading,
    showLogin,
  }
}
