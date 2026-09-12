import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { useProtectedActions } from './useProtectedActions'
import { resolveStirAuthRedirect } from '../../utils/authRedirect'

export function useProtectedLogin() {
  const toast = useToast()
  const isLoading = ref(false)
  const turnstileKey = ref(0)
  const turnstileToken = ref('')
  const route = useRoute()
  const { login } = useProtectedActions()
  const protectedFallbackRedirectPath =
    useAppConfig().protectedRoutes?.fallbackRedirectPath || '/'

  const fields: AuthFormField[] = [
    {
      name: 'password',
      type: 'password',
      label: 'Password',
      placeholder: 'Enter password',
      required: true,
    },
  ]

  const validate = (formState: { password?: string }) => {
    if (formState.password) {
      return []
    }

    return [{ name: 'password', message: 'Password is required' }]
  }

  const onSubmit = async (
    event: FormSubmitEvent<{ password: string }>,
  ) => {
    isLoading.value = true
    try {
      const hasAccess = await login(event.data.password, turnstileToken.value)

      if (hasAccess) {
        await navigateTo(
          resolveStirAuthRedirect(
            route.query.redirect,
            protectedFallbackRedirectPath,
          ),
        )
      }
    } catch {
      toast.add({
        title: 'Access denied',
        description: 'That password isn\'t right. Try again.',
        color: 'error',
      })
    } finally {
      turnstileToken.value = ''
      turnstileKey.value += 1
      isLoading.value = false
    }
  }

  return {
    fields,
    turnstileKey,
    turnstileToken,
    validate,
    onSubmit,
    isLoading,
  }
}
