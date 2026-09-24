import type { AuthFormField, ButtonProps, FormSubmitEvent } from '@nuxt/ui'
import type { RouteLocationRaw } from 'vue-router'
import { useAuthActions } from './useAuthActions'
import { useAuthConfig } from './useAuthConfig'
import { useAuthSession } from './useAuthSession'
import { createLoginValidationSchema } from '../utils/authValidation'
import {
  resolveStirAuthRedirect,
  safeStirAuthRedirect,
} from '../utils/authRedirect'
import { validateForm } from '../utils/validationErrors'
import type { AuthFormState, AuthUiIdentifierField } from '../types/auth'

export interface StirAuthLoginRedirectContext {
  /**
   * The `?redirect=` value, when present and safe to navigate to.
   */
  redirect?: string
  /**
   * The Drupal-configured default, already checked for safety.
   */
  fallback: string
}

export type StirAuthLoginRedirectResult =
  | string
  | RouteLocationRaw
  | false

export interface StirAuthLoginError {
  title: string
  /**
   * Drupal's message, or a generic hint when the response carried none.
   */
  message: string
  /**
   * Drupal's machine-readable reason, such as `invalid_credentials` or
   * `verification_required`; empty when the response carried none.
   */
  code: string
}

export interface StirAuthLoginOptions {
  /**
   * Chooses where to send the visitor after a successful sign-in.
   *
   * Runs once the session has resolved, so a destination that depends on the
   * signed-in account can be decided here. Return `false` to navigate nowhere
   * and let the page handle it.
   *
   * The returned destination is used as given. It is caller-authored, not
   * visitor input, so it is not re-checked; do not pass a raw query parameter
   * through it, use the `redirect` already supplied on the context.
   */
  redirectTo?: (
    context: StirAuthLoginRedirectContext,
  ) => StirAuthLoginRedirectResult | Promise<StirAuthLoginRedirectResult>
  /**
   * Shows a failed sign-in as a toast. Set to `false` when the page renders
   * the returned `error` inline, so the failure is not announced twice.
   */
  toastErrors?: boolean
}

export function useAuthLogin(options: StirAuthLoginOptions = {}) {
  const toast = useToast()
  const isLoading = ref(false)
  const turnstileToken = ref('')
  const error = ref<StirAuthLoginError | null>(null)
  const isResending = ref(false)
  const {
    login,
    resendVerification: requestVerificationEmail,
    getFetchErrorMessage,
    getFetchErrorCode,
  } = useAuthActions()
  const { auth } = useAuthConfig()
  const session = useAuthSession()
  const route = useRoute()
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

  let lastIdentifier = ''

  const resendVerification = async () => {
    if (!lastIdentifier || isResending.value) return

    isResending.value = true

    try {
      await requestVerificationEmail(lastIdentifier)
      toast.add({
        title: 'Check your inbox',
        description:
          'If that address has an account waiting for verification, we\'ve sent a new link.',
        color: 'success',
      })
    } catch (resendError: unknown) {
      toast.add({
        title: 'Couldn\'t send the email',
        description: getFetchErrorMessage(
          resendError,
          'Please try again in a few minutes.',
        ),
        color: 'error',
      })
    } finally {
      isResending.value = false
    }
  }

  const errorActions = computed<ButtonProps[]>(() =>
    error.value?.code === 'verification_required'
      ? [{
          label: 'Resend verification email',
          loading: isResending.value,
          onClick: resendVerification,
        }]
      : [],
  )

  const onSubmit = async (
    event: FormSubmitEvent<AuthFormState>,
  ) => {
    isLoading.value = true
    error.value = null
    lastIdentifier = (event.data.identifier || '').trim()

    try {
      const loginResult = await login({
        identifier: lastIdentifier,
        password: event.data.password || '',
        turnstile_response: turnstileToken.value,
      })

      if (loginResult.loggedIn) {
        toast.add({
          title: auth.value.login?.successToast?.title || 'Signed in',
          description:
            auth.value.login?.successToast?.description ||
            'Signed in successfully.',
          color: 'success',
        })
        const redirectContext: StirAuthLoginRedirectContext = {
          redirect: safeStirAuthRedirect(route.query.redirect),
          fallback: resolveStirAuthRedirect(auth.value.loginRedirectPath),
        }
        const destination = options.redirectTo
          ? await options.redirectTo(redirectContext)
          : redirectContext.redirect ?? redirectContext.fallback

        if (destination !== false) {
          await navigateTo(destination)
        }
      } else {
        const backendAuthenticated = Boolean(
          loginResult.response?.session?.authenticated,
        )

        toast.add({
          title: backendAuthenticated
            ? 'Session cookie missing'
            : 'Sign-in incomplete',
          description: backendAuthenticated
            ? 'Your credentials were accepted, but no browser session cookie is active. Check domain/cookie settings.'
            : 'Signed in, but no active session was detected.',
          color: 'warning',
        })
      }
    } catch (loginError: unknown) {
      error.value = {
        title: 'Couldn\'t sign you in',
        message: getFetchErrorMessage(
          loginError,
          'Check your email and password and try again.',
        ),
        code: getFetchErrorCode(loginError),
      }

      if (options.toastErrors !== false) {
        toast.add({
          // A fixed id replaces the previous failure instead of stacking.
          id: 'stir-auth-login-error',
          title: error.value.title,
          description: error.value.message,
          color: 'error',
          actions: errorActions.value,
        })
      }
      session.clearSession()
    } finally {
      isLoading.value = false
      // The server spends the token on every attempt; clearing it makes the
      // widget issue a fresh one for the next submission.
      turnstileToken.value = ''
    }
  }

  return {
    fields,
    turnstileToken,
    validate,
    onSubmit,
    onError,
    isLoading,
    error,
    errorActions,
    isResending,
    resendVerification,
  }
}
