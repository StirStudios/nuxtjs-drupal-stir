import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { useAuthActions } from '~/composables/auth/useAuthActions'

export function useAuthRegister() {
  const toast = useToast()
  const isLoading = ref(false)
  const turnstileToken = ref('')
  const { register, getFetchErrorMessage } = useAuthActions()

  const fields: AuthFormField[] = [
    {
      name: 'display_name',
      type: 'text',
      label: 'Display name',
      placeholder: 'Enter your display name',
      required: false,
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email',
      placeholder: 'Enter your email',
      required: true,
    },
    {
      name: 'password',
      type: 'password',
      label: 'Password',
      placeholder: 'Create a password',
      required: true,
    },
  ]

  const validate = (formState: {
    email?: string
    password?: string
  }) => {
    const errors: Array<{ name: string; message: string }> = []

    if (!formState.email?.trim()) {
      errors.push({ name: 'email', message: 'Email is required' })
    }

    if (!formState.password?.trim()) {
      errors.push({ name: 'password', message: 'Password is required' })
    }

    return errors
  }

  const onSubmit = async (
    event: FormSubmitEvent<{
      display_name?: string
      email: string
      password: string
    }>,
  ) => {
    isLoading.value = true

    try {
      const response = await register({
        display_name: event.data.display_name?.trim(),
        email: event.data.email.trim(),
        password: event.data.password.trim(),
        turnstile_response: turnstileToken.value,
      })

      const requiresVerification = Boolean(response?.verification_required)
      const verificationSent = Boolean(response?.verification_sent)

      if (requiresVerification) {
        toast.add({
          title: verificationSent ? 'Verify your email' : 'Account created',
          description: verificationSent
            ? 'Check your inbox to verify your account before signing in.'
            : 'Your account was created and requires email verification before sign-in.',
          color: verificationSent ? 'success' : 'warning',
        })
      } else {
        toast.add({
          title: 'Account created',
          description: 'Your account has been created. You can now sign in.',
          color: 'success',
        })
      }

      await navigateTo('/auth/login')
    } catch (error: unknown) {
      toast.add({
        title: 'Registration failed',
        description: getFetchErrorMessage(error, 'Registration failed.'),
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
    turnstileToken,
  }
}
