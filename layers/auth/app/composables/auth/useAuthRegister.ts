import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { useAuthActions } from './useAuthActions'
import { registerValidationSchema } from '../../utils/authValidation'
import { mapYupValidationErrors } from '../../utils/yupValidation'

export function useAuthRegister() {
  const toast = useToast()
  const isLoading = ref(false)
  const registrationComplete = ref(false)
  const registrationMessage = ref('')
  const requiresVerification = ref(false)
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
    display_name?: string
    email?: string
    password?: string
  }) => {
    try {
      registerValidationSchema.validateSync(formState, { abortEarly: false })
      return []
    } catch (error: unknown) {
      return mapYupValidationErrors(error)
    }
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

      const isVerificationRequired = Boolean(response?.verification_required)
      const isVerificationSent = Boolean(response?.verification_sent)

      if (isVerificationRequired) {
        registrationComplete.value = true
        requiresVerification.value = true
        registrationMessage.value = isVerificationSent
          ? 'Check your inbox to verify your account before signing in.'
          : 'Your account was created and requires email verification before sign-in.'
        toast.add({
          title: isVerificationSent ? 'Verify your email' : 'Account created',
          description: registrationMessage.value,
          color: isVerificationSent ? 'success' : 'warning',
        })
      } else {
        registrationComplete.value = true
        requiresVerification.value = false
        registrationMessage.value = 'Your account has been created. You can now sign in.'
        toast.add({
          title: 'Account created',
          description: registrationMessage.value,
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
    registrationComplete,
    registrationMessage,
    requiresVerification,
    turnstileToken,
  }
}
