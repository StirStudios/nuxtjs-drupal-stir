import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { useAuthActions } from './useAuthActions'
import { useAuthConfig } from './useAuthConfig'
import { useAuthSession } from './useAuthSession'
import { loginValidationSchema } from '../../utils/authValidation'
import { mapYupValidationErrors } from '../../utils/yupValidation'

export function useAuthLogin() {
  const toast = useToast()
  const isLoading = ref(false)
  const turnstileToken = ref('')
  const { login, getFetchErrorMessage } = useAuthActions()
  const { loginRedirectPath } = useAuthConfig()
  const session = useAuthSession()
  const { onError } = useValidation()

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
    try {
      loginValidationSchema.validateSync(formState, { abortEarly: false })
      return []
    } catch (error: unknown) {
      return mapYupValidationErrors(error)
    }
  }

  const onSubmit = async (
    event: FormSubmitEvent<{ identifier: string; password: string }>,
  ) => {
    isLoading.value = true

    try {
      const loginResult = await login({
        identifier: event.data.identifier?.trim(),
        password: event.data.password?.trim(),
        turnstile_response: turnstileToken.value,
      })

      if (loginResult.loggedIn) {
        toast.add({
          title: 'Success',
          description: 'Signed in successfully.',
          color: 'success',
        })
        await navigateTo(loginRedirectPath.value)
      } else {
        const backendAuthenticated = Boolean(
          loginResult.response?.session?.authenticated,
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
      toast.add({
        title: 'Sign-in failed',
        description: getFetchErrorMessage(error, 'Sign-in failed.'),
        color: 'error',
      })
      session.clearSession()
    } finally {
      isLoading.value = false
    }
  }

  return {
    fields,
    turnstileToken,
    validate,
    onSubmit,
    onError,
    isLoading,
  }
}
