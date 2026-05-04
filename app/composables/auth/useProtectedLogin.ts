import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { useProtectedSession } from '~/composables/auth/useProtectedSession'

export function useProtectedLogin() {
  const config = useAppConfig().protectedRoutes
  const toast = useToast()
  const isLoading = ref(false)
  const route = useRoute()
  const protectedSession = useProtectedSession()

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
      await $fetch('/api/auth/protected', {
        method: 'POST',
        body: {
          password: event.data.password?.trim(),
        },
      })
      await protectedSession.fetchSession()

      if (protectedSession.loggedIn.value) {
        const redirectTarget =
          typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
            ? route.query.redirect
            : config?.redirectOnLogin || '/'

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
