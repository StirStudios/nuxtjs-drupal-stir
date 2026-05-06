import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { useProtectedActions } from '~/composables/auth/useProtectedActions'
import { useAuthConfig } from '~/composables/auth/useAuthConfig'

export function useProtectedLogin() {
  const toast = useToast()
  const isLoading = ref(false)
  const route = useRoute()
  const { login } = useProtectedActions()
  const { protectedFallbackRedirectPath } = useAuthConfig()

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
    if (formState.password?.trim()) {
      return []
    }

    return [{ name: 'password', message: 'Password is required' }]
  }

  const onSubmit = async (
    event: FormSubmitEvent<{ password: string }>,
  ) => {
    isLoading.value = true
    try {
      const hasAccess = await login(event.data.password?.trim())

      if (hasAccess) {
        const redirectTarget =
          typeof route.query.redirect === 'string' &&
          route.query.redirect.startsWith('/')
            ? route.query.redirect
            : protectedFallbackRedirectPath.value

        await navigateTo(redirectTarget)
      }
    } catch {
      toast.add({
        title: 'Access denied',
        description: 'Invalid password.',
        color: 'error',
      })
    } finally {
      isLoading.value = false
    }
  }

  return {
    fields,
    validate,
    onSubmit,
    isLoading,
  }
}
