import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { useAuthActions } from './useAuthActions'
import { useAuthConfig } from './useAuthConfig'
import { useAuthSession } from './useAuthSession'
import { createLoginValidationSchema } from '../../utils/authValidation'
import { validateForm } from '../../utils/validationErrors'
import type { AuthUiIdentifierField } from '../../types/auth'

export function useAuthLogin() {
  const toast = useToast()
  const isLoading = ref(false)
  const turnstileToken = ref('')
  const { login, getFetchErrorMessage } = useAuthActions()
  const { auth } = useAuthConfig()
  const session = useAuthSession()
  const { onError } = useValidation()

  const identifierField = computed<AuthUiIdentifierField>(() => ({
    ...auth.value.login?.identifier,
    mode: auth.value.login?.identifier?.mode || auth.value.identifierModes?.login,
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
    {
      name: 'password',
      type: 'password',
      label: auth.value.login?.password?.label || 'Password',
      placeholder:
        auth.value.login?.password?.placeholder || 'Enter your password',
      required: true,
    },
  ])

  const validate = (formState: { identifier?: string; password?: string }) => {
    return validateForm(
      createLoginValidationSchema(
        identifierField.value,
        auth.value.login?.password?.requiredMessage || 'Password is required',
      ),
      formState,
    )
  }

  const onSubmit = async (
    event: FormSubmitEvent<{ identifier: string; password: string }>,
  ) => {
    isLoading.value = true

    try {
      const loginResult = await login({
        identifier: event.data.identifier?.trim(),
        password: event.data.password,
        turnstile_response: turnstileToken.value,
      })

      if (loginResult.loggedIn) {
        toast.add({
          title: auth.value.login?.successToast?.title || 'Success',
          description:
            auth.value.login?.successToast?.description ||
            'Signed in successfully.',
          color: 'success',
        })
        await navigateTo(auth.value.loginRedirectPath || '/')
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
