import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { useAuthActions } from './useAuthActions'
import { useAuthConfig } from './useAuthConfig'
import { createPasswordRequestValidationSchema } from '../../utils/authValidation'
import { mapYupValidationErrors } from '../../utils/yupValidation'
import type { AuthUiIdentifierField } from '../../types/auth'

export function usePasswordRequest() {
  const toast = useToast()
  const isLoading = ref(false)
  const requestSent = ref(false)
  const turnstileToken = ref('')
  const { requestPasswordReset, getFetchErrorMessage } = useAuthActions()
  const { auth } = useAuthConfig()

  const identifierField = computed<AuthUiIdentifierField>(() => ({
    ...auth.value.passwordRequest?.identifier,
    mode:
      auth.value.passwordRequest?.identifier?.mode ||
      auth.value.identifierModes?.passwordRequest ||
      auth.value.identifierModes?.login,
  }))

  const fields = computed<AuthFormField[]>(() => [
    {
      name: 'identifier',
      type: identifierField.value.mode === 'email' ? 'email' : 'text',
      label: identifierField.value.label || 'Email or username',
      placeholder:
        identifierField.value.placeholder ||
        'Enter your email or username',
      required: true,
    },
  ])

  const validate = (formState: { identifier?: string }) => {
    try {
      createPasswordRequestValidationSchema(
        identifierField.value,
      ).validateSync(formState, { abortEarly: false })
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

      requestSent.value = true
      toast.add({
        title: 'Request sent',
        description:
          auth.value.passwordRequest?.sentDescription ||
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
    requestSent,
    turnstileToken,
  }
}
