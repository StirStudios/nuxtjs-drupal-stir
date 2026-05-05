import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { useAuthActions } from '~/composables/auth/useAuthActions'

export function usePasswordReset() {
  const route = useRoute()
  const toast = useToast()
  const isLoading = ref(false)
  const { resetPassword, getFetchErrorMessage } = useAuthActions()

  const fields: AuthFormField[] = [
    {
      name: 'password',
      type: 'password',
      label: 'New password',
      placeholder: 'Enter your new password',
      required: true,
    },
    {
      name: 'confirmPassword',
      type: 'password',
      label: 'Confirm password',
      placeholder: 'Confirm your new password',
      required: true,
    },
  ]

  const uid = computed(() => Number.parseInt(String(route.query.uid || ''), 10))
  const timestamp = computed(() =>
    Number.parseInt(String(route.query.timestamp || ''), 10),
  )
  const hash = computed(() => String(route.query.hash || '').trim())

  const validate = (formState: { password?: string; confirmPassword?: string }) => {
    const errors: Array<{ name: string; message: string }> = []

    if (!formState.password?.trim()) {
      errors.push({ name: 'password', message: 'Password is required' })
    }

    if (!formState.confirmPassword?.trim()) {
      errors.push({ name: 'confirmPassword', message: 'Confirm password is required' })
    }

    if (
      formState.password?.trim() &&
      formState.confirmPassword?.trim() &&
      formState.password.trim() !== formState.confirmPassword.trim()
    ) {
      errors.push({ name: 'confirmPassword', message: 'Passwords do not match' })
    }

    if (!Number.isInteger(uid.value) || !Number.isInteger(timestamp.value) || !hash.value) {
      errors.push({ name: 'password', message: 'Reset link is invalid or incomplete' })
    }

    return errors
  }

  const onSubmit = async (
    event: FormSubmitEvent<{ password: string; confirmPassword: string }>,
  ) => {
    isLoading.value = true

    try {
      await resetPassword({
        uid: uid.value,
        timestamp: timestamp.value,
        hash: hash.value,
        password: event.data.password.trim(),
      })

      toast.add({
        title: 'Password updated',
        description: 'Your password has been reset. You can now sign in.',
        color: 'success',
      })

      await navigateTo('/auth/login')
    } catch (error: unknown) {
      toast.add({
        title: 'Reset failed',
        description: getFetchErrorMessage(error, 'Password reset failed.'),
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
