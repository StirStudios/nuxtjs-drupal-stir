import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { useAuthActions } from '~/composables/auth/useAuthActions'
import { passwordResetValidationSchema } from '~/utils/authValidation'
import { mapYupValidationErrors } from '~/utils/yupValidation'

export function usePasswordReset() {
  const route = useRoute()
  const toast = useToast()
  const isLoading = ref(false)
  const isCheckingLink = ref(true)
  const linkValid = ref(false)
  const linkMessage = ref('Validating reset link...')
  const { resetPassword, validatePasswordReset, getFetchErrorMessage } =
    useAuthActions()

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

    try {
      passwordResetValidationSchema.validateSync(formState, {
        abortEarly: false,
      })
    } catch (error: unknown) {
      errors.push(...mapYupValidationErrors(error))
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
      linkMessage.value = 'Reset link is invalid or incomplete.'
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
      linkMessage.value = 'This reset link is invalid, expired, or already used.'
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
