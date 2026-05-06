import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { useAuthActions } from '~/composables/auth/useAuthActions'
import { passwordRequestValidationSchema } from '~/utils/authValidation'
import { mapYupValidationErrors } from '~/utils/yupValidation'

export function usePasswordRequest() {
  const toast = useToast()
  const isLoading = ref(false)
  const turnstileToken = ref('')
  const { requestPasswordReset, getFetchErrorMessage } = useAuthActions()

  const fields: AuthFormField[] = [
    {
      name: 'identifier',
      type: 'text',
      label: 'Email or username',
      placeholder: 'Enter your email or username',
      required: true,
    },
  ]

  const validate = (formState: { identifier?: string }) => {
    try {
      passwordRequestValidationSchema.validateSync(formState, {
        abortEarly: false,
      })
      return []
    } catch (error: unknown) {
      return mapYupValidationErrors(error)
    }
  }

  const onSubmit = async (
    event: FormSubmitEvent<{ identifier: string }>,
  ) => {
    isLoading.value = true

    try {
      await requestPasswordReset({
        identifier: event.data.identifier.trim(),
        turnstile_response: turnstileToken.value,
      })

      toast.add({
        title: 'Request sent',
        description:
          'If an account exists for that email or username, reset instructions have been sent.',
        color: 'success',
      })
    } catch (error: unknown) {
      toast.add({
        title: 'Request failed',
        description: getFetchErrorMessage(
          error,
          'Password reset request failed.',
        ),
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
