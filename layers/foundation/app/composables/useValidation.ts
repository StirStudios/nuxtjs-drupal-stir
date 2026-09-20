import type { FormErrorEvent } from '@nuxt/ui'

/**
 * The part of Nuxt UI's error event this helper reads.
 *
 * FormErrorEvent is a real SubmitEvent, so narrowing to the errors keeps the
 * helper callable from tests without constructing a DOM event.
 */
type ValidationErrorEvent = Pick<FormErrorEvent, 'errors'>

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
  event: ValidationErrorEvent,
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

  // Nuxt UI only carries an id for errors it could bind to an input.
  const element = firstError.id
    ? validationContext.getElementById(firstError.id)
    : null

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
