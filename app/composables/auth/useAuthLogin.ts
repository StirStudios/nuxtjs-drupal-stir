import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import type { LoginResponse } from '~/types/auth'
import { useAuthSession } from '~/composables/auth/useAuthSession'

export function useAuthLogin() {
  const config = useAppConfig().protectedRoutes
  const heading = computed(() => config?.loginHeading || 'Login')
  const toast = useToast()
  const isLoading = ref(false)
  const state = reactive({
    identifier: '' as string,
    password: '' as string,
  })
  const turnstileToken = ref('')
  const fields: AuthFormField[] = [
    {
      name: 'identifier',
      type: 'text',
      label: 'Email or username',
      placeholder: 'Enter your email or username',
      required: true,
    },
    {
      name: 'password',
      type: 'password',
      label: 'Password',
      placeholder: 'Enter your password',
      required: true,
    },
  ]
  const validate = (formState: { identifier?: string; password?: string }) => {
    const errors: Array<{ name: string; message: string }> = []

    if (!formState.identifier?.trim()) {
      errors.push({
        name: 'identifier',
        message: 'Email or username is required',
      })
    }

    if (!formState.password?.trim()) {
      errors.push({
        name: 'password',
        message: 'Password is required',
      })
    }

    return errors
  }
  const session = useAuthSession()
  const { onError } = useValidation()
  const onSubmit = async (
    event: FormSubmitEvent<{ identifier: string; password: string }>,
  ) => {
    isLoading.value = true
    try {
      const loginResponse = await $fetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: {
          identifier: event.data.identifier?.trim(),
          password: event.data.password?.trim(),
          turnstile_response: turnstileToken.value,
        },
      })

      await session.fetchSession()

      if (session.loggedIn.value) {
        toast.add({
          title: 'Success',
          description: 'Signed in successfully.',
          color: 'success',
        })
        navigateTo(config?.redirectOnLogin || '/')
      } else {
        const backendAuthenticated = Boolean(
          loginResponse?.session?.authenticated,
        )

        toast.add({
          title: backendAuthenticated
            ? 'Session cookie missing'
            : 'Sign-in incomplete',
          description: backendAuthenticated
            ? 'Credentials were accepted, but no browser session cookie is active. Check domain/cookie settings.'
            : 'Signed in but no active session was detected.',
          color: 'warning',
        })
      }
    } catch (error: unknown) {
      const statusMessage =
        typeof error === 'object' &&
        error !== null &&
        'statusMessage' in error &&
        typeof (error as { statusMessage?: unknown }).statusMessage === 'string'
          ? (error as { statusMessage: string }).statusMessage
          : ''
      const dataError =
        typeof error === 'object' &&
        error !== null &&
        'data' in error &&
        typeof (error as { data?: { error?: unknown } }).data?.error === 'string'
          ? (error as { data: { error: string } }).data.error
          : ''

      const message = dataError || statusMessage || 'Sign-in failed.'

      toast.add({
        title: 'Sign-in failed',
        description: message,
        color: 'error',
      })
    } finally {
      isLoading.value = false
    }
  }

  return {
    heading,
    state,
    fields,
    turnstileToken,
    validate,
    onSubmit,
    onError,
    isLoading,
  }
}
