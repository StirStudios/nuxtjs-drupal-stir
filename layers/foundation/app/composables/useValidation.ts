type FormErrorEvent = {
  errors: { id: string; message?: string }[]
}

type ToastLike = {
  add: (payload: {
    title: string
    description: string
    color: 'error'
  }) => void
}

type ValidationOptions = {
  showToast?: boolean
}

export function handleValidationError(
  event: FormErrorEvent,
  validationContext: {
    isClient: boolean
    showToast?: boolean
    toast: ToastLike
    getElementById: (id: string) => {
      focus?: () => void
      scrollIntoView?: (scrollOptions?: ScrollIntoViewOptions) => void
    } | null
  },
) {
  if (!validationContext.isClient || !event?.errors?.length) return

  const firstError = event.errors[0]

  if (!firstError) return

  const element = validationContext.getElementById(firstError.id)

  element?.focus?.()
  element?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })

  if (validationContext.showToast === false) return

  validationContext.toast.add({
    title: 'Form Incomplete',
    description: 'Some required fields are missing or incorrect.',
    color: 'error',
  })
}

export function useValidation(options: ValidationOptions = {}) {
  const toast = useToast()

  const onError = (event: FormErrorEvent) => {
    handleValidationError(event, {
      isClient: import.meta.client,
      showToast: options.showToast,
      toast,
      getElementById: id => document.getElementById(id),
    })
  }

  return { onError }
}
