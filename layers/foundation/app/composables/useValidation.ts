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
  const instance = getCurrentInstance()

  const onError = (event: FormErrorEvent) => {
    // A form inside a shadow DOM, such as an embedded widget, is out of
    // document's reach, so look its fields up from the form's own root.
    // Nuxt UI's error event is a copy without the form as its target.
    const root = (instance?.proxy?.$el as Node | null | undefined)?.getRootNode?.()
    const scope = root instanceof ShadowRoot ? root : document

    // Nuxt UI disables the fields while it validates and emits this error
    // before enabling them again. A disabled field cannot take focus, so wait
    // for the render that enables it.
    setTimeout(() => {
      handleValidationError(event, {
        isClient: import.meta.client,
        showToast: options.showToast,
        toast,
        getElementById: id => scope.getElementById(id),
      })
    })
  }

  return { onError }
}
