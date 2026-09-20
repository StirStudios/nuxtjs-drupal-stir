import type { AuthFormField, FormError, FormSubmitEvent } from '@nuxt/ui'
import type { AuthFormState, RegisterFieldValue } from '../types/auth'
import { useAuthActions } from './useAuthActions'
import { useAuthConfig } from './useAuthConfig'
import { createRegisterValidationSchema } from '../utils/authValidation'
import { registrationRequirement } from '../utils/registrationCompletion'
import { validateForm } from '../utils/validationErrors'

export type StirAuthRegisterCredentials = {
  email?: string
  password?: string
}

export interface StirAuthRegisterOptions<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * Initial values for project-specific signup fields. They are held in
   * `state` and rendered through the `AuthRegister` `fields` slot.
   */
  initialState?: T
  /**
   * Maps `state` to the `fields` object sent with registration. Defaults to
   * the state as-is. Keys must be accepted by `/api/auth/register`.
   */
  toFields?: (state: T) => Record<string, RegisterFieldValue>
  /**
   * Extra client validation, merged with the email and password errors.
   * Name each error after the matching `UFormField`.
   */
  validate?: (state: StirAuthRegisterCredentials & T) => FormError[]
}

export function useAuthRegister<
  T extends Record<string, unknown> = Record<string, unknown>,
>(options: StirAuthRegisterOptions<T> = {}) {
  const toast = useToast()
  const isLoading = ref(false)
  const registrationComplete = ref(false)
  const registrationMessage = ref('')
  const requiresVerification = ref(false)
  const requiresApproval = ref(false)
  const turnstileToken = ref('')
  const state = reactive(structuredClone(toRaw(options.initialState ?? {}))) as T
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

  const validate = (formState: StirAuthRegisterCredentials) => {
    const errors = validateForm(
      createRegisterValidationSchema(
        auth.value.register?.email,
        auth.value.passwordPolicy,
      ),
      formState,
    )

    return options.validate
      ? [...errors, ...options.validate({ ...state, ...formState })]
      : errors
  }

  const onSubmit = async (
    event: FormSubmitEvent<AuthFormState>,
  ) => {
    isLoading.value = true

    try {
      const extraFields = options.toFields
        ? options.toFields(state)
        : { ...state } as Record<string, RegisterFieldValue>
      const response = await register({
        email: (event.data.email || '').trim(),
        password: event.data.password || '',
        turnstile_response: turnstileToken.value,
        ...(Object.keys(extraFields).length ? { fields: extraFields } : {}),
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
      // The server spends the token on every attempt; clearing it makes the
      // widget issue a fresh one for the next submission.
      turnstileToken.value = ''
    }
  }

  return {
    fields,
    state,
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
