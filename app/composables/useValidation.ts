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

export function handleValidationError(
  event: FormErrorEvent,
  validationContext: {
    isClient: boolean
    toast: ToastLike
    getElementById: (id: string) => {
      focus?: () => void
      scrollIntoView?: (scrollOptions?: ScrollIntoViewOptions) => void
    } | null
  },
) {
  if (!validationContext.isClient) return
  if (!event?.errors?.length) return

  const firstError = event.errors[0]

  if (!firstError) return

  const element = validationContext.getElementById(firstError.id)

  element?.focus?.()
  element?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })

  validationContext.toast.add({
    title: 'Form Incomplete',
    description: 'Some required fields are missing or incorrect.',
    color: 'error',
  })
}

export const useValidation = () => {
  const toast = useToast()

  const onError = (event: FormErrorEvent) => {
    handleValidationError(event, {
      isClient: import.meta.client,
      toast,
      getElementById: (id) => document.getElementById(id),
    })
  }

  return { onError }
}
