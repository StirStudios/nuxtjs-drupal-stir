import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { useAuthActions } from './useAuthActions'
import { useAuthConfig } from './useAuthConfig'
import { createPasswordResetValidationSchema } from '../../utils/authValidation'
import { validateForm } from '../../utils/validationErrors'

export function usePasswordReset() {
  const route = useRoute()
  const toast = useToast()
  const isLoading = ref(false)
  const isCheckingLink = ref(true)
  const linkValid = ref(false)
  const linkMessage = ref('Validating reset link...')
  const { resetPassword, validatePasswordReset, getFetchErrorMessage } =
    useAuthActions()
  const { auth } = useAuthConfig()

  const fields = computed<AuthFormField[]>(() => [
    {
      name: 'password',
      type: 'password',
      label: auth.value.passwordReset?.password?.label || 'New password',
      placeholder:
        auth.value.passwordReset?.password?.placeholder ||
        'Enter your new password',
      required: true,
    },
    {
      name: 'confirmPassword',
      type: 'password',
      label:
        auth.value.passwordReset?.confirmPassword?.label ||
        'Confirm password',
      placeholder:
        auth.value.passwordReset?.confirmPassword?.placeholder ||
        'Confirm your new password',
      required: true,
    },
  ])

  const uid = computed(() => Number.parseInt(String(route.query.uid || ''), 10))
  const timestamp = computed(() =>
    Number.parseInt(String(route.query.timestamp || ''), 10),
  )
  const hash = computed(() => String(route.query.hash || '').trim())

  const validate = (formState: { password?: string; confirmPassword?: string }) => {
    const errors: Array<{ name: string; message: string }> = []

    errors.push(...validateForm(
      createPasswordResetValidationSchema(
        auth.value.passwordPolicy,
        auth.value.passwordReset?.confirmPassword?.requiredMessage ||
          'Confirm password is required',
        auth.value.passwordReset?.confirmPassword?.mismatchMessage ||
          'Passwords do not match',
      ),
      formState,
    ))

    if (!Number.isInteger(uid.value) || !Number.isInteger(timestamp.value) || !hash.value) {
      errors.push({
        name: 'password',
        message:
          auth.value.passwordReset?.invalidLinkMessage ||
          'Reset link is invalid or incomplete.',
      })
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
        password: event.data.password,
      })

      toast.add({
        title:
          auth.value.passwordReset?.successToast?.title ||
          'Password updated',
        description:
          auth.value.passwordReset?.successToast?.description ||
          'Your password has been reset. You can now sign in.',
        color: 'success',
      })

      await navigateTo('/auth/login')
    } catch (error: unknown) {
      linkValid.value = false
      linkMessage.value = getFetchErrorMessage(
        error,
        'Reset link is invalid or expired.',
      )
      toast.add({
        title: 'Reset failed',
        description: linkMessage.value,
        color: 'error',
      })
    } finally {
      isLoading.value = false
    }
  }

  onMounted(async () => {
    if (
      !Number.isInteger(uid.value) ||
      !Number.isInteger(timestamp.value) ||
      !hash.value
    ) {
      isCheckingLink.value = false
      linkValid.value = false
      linkMessage.value =
        auth.value.passwordReset?.invalidLinkMessage ||
        'Reset link is invalid or incomplete.'
      return
    }

    try {
      await validatePasswordReset({
        uid: uid.value,
        timestamp: timestamp.value,
        hash: hash.value,
      })
      linkValid.value = true
    } catch {
      linkValid.value = false
      linkMessage.value =
        auth.value.passwordReset?.expiredLinkMessage ||
        'This reset link is invalid, expired, or already used.'
    } finally {
      isCheckingLink.value = false
    }
  })

  return {
    fields,
    validate,
    onSubmit,
    isLoading,
    isCheckingLink,
    linkValid,
    linkMessage,
  }
}
