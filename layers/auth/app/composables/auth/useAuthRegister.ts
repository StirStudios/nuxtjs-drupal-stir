import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { useAuthActions } from './useAuthActions'
import { useAuthConfig } from './useAuthConfig'
import { createRegisterValidationSchema } from '../../utils/authValidation'
import { registrationRequirement } from '../../utils/registrationCompletion'
import { validateForm } from '../../utils/validationErrors'

export function useAuthRegister() {
  const toast = useToast()
  const isLoading = ref(false)
  const registrationComplete = ref(false)
  const registrationMessage = ref('')
  const requiresVerification = ref(false)
  const requiresApproval = ref(false)
  const turnstileToken = ref('')
  const { register, getFetchErrorMessage } = useAuthActions()
  const { auth } = useAuthConfig()

  const fields = computed<AuthFormField[]>(() => [
    {
      name: 'email',
      type: 'email',
      label: auth.value.register?.email?.label || 'Email',
      placeholder: auth.value.register?.email?.placeholder || 'Enter your email',
      required: true,
    },
    {
      name: 'password',
      type: 'password',
      label: auth.value.register?.password?.label || 'Password',
      placeholder:
        auth.value.register?.password?.placeholder || 'Create a password',
      required: true,
    },
  ])

  const validate = (formState: {
    email?: string
    password?: string
  }) => {
    return validateForm(
      createRegisterValidationSchema(
        auth.value.register?.email,
        auth.value.passwordPolicy,
      ),
      formState,
    )
  }

  const onSubmit = async (
    event: FormSubmitEvent<{
      email: string
      password: string
    }>,
  ) => {
    isLoading.value = true

    try {
      const response = await register({
        email: event.data.email.trim(),
        password: event.data.password,
        turnstile_response: turnstileToken.value,
      })

      const requirement = registrationRequirement(response)
      const isVerificationSent = Boolean(response?.verification_sent)

      registrationComplete.value = true
      requiresApproval.value = requirement === 'approval'
      requiresVerification.value = requirement === 'verification'

      if (requirement === 'approval') {
        registrationMessage.value =
          'Your account has been created and is awaiting administrator approval before you can sign in.'
        toast.add({
          title: 'Account awaiting approval',
          description: registrationMessage.value,
          color: 'warning',
        })
      } else if (requirement === 'verification') {
        registrationMessage.value = isVerificationSent
          ? auth.value.register?.complete?.verificationSentDescription ||
            'Check your inbox to verify your account before signing in.'
          : auth.value.register?.complete?.verificationRequiredDescription ||
            'Your account was created and requires email verification before sign-in.'
        toast.add({
          title: isVerificationSent
            ? auth.value.register?.complete?.verificationTitle ||
              'Verify your email'
            : auth.value.register?.complete?.createdTitle || 'Account created',
          description: registrationMessage.value,
          color: isVerificationSent ? 'success' : 'warning',
        })
      } else {
        registrationMessage.value =
          auth.value.register?.complete?.createdDescription ||
          'Your account has been created. You can now sign in.'
        toast.add({
          title: auth.value.register?.complete?.createdTitle || 'Account created',
          description: registrationMessage.value,
          color: 'success',
        })
      }
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
    requiresApproval,
    requiresVerification,
    turnstileToken,
  }
}
