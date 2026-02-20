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
  options: {
    isClient: boolean
    toast: ToastLike
    getElementById: (id: string) => {
      focus?: () => void
      scrollIntoView?: (options?: ScrollIntoViewOptions) => void
    } | null
  },
) {
  if (!options.isClient) return
  if (!event?.errors?.length) return

  const firstError = event.errors[0]

  if (!firstError) return

  const element = options.getElementById(firstError.id)

  element?.focus?.()
  element?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })

  options.toast.add({
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
