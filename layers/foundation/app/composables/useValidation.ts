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

type ValidationField = {
  focus?: (focusOptions?: FocusOptions) => void
  scrollIntoView?: (scrollOptions?: ScrollIntoViewOptions) => void
  compareDocumentPosition?: (other: Node) => number
  getBoundingClientRect?: () => { top: number, bottom: number }
}

// Node.DOCUMENT_POSITION_FOLLOWING: the other node comes after this one.
const DOCUMENT_POSITION_FOLLOWING = 4

// A field already on screen is only focused. Scrolling it towards the centre
// would move the page while a sticky panel holding it stays put.
function isOnScreen(field: ValidationField): boolean {
  const box = field.getBoundingClientRect?.()

  return !!box && box.top >= 0 && box.bottom <= window.innerHeight
}

function comesBefore(field: ValidationField, other: ValidationField): boolean {
  return !!field.compareDocumentPosition
    && (field.compareDocumentPosition(other as Node) & DOCUMENT_POSITION_FOLLOWING) !== 0
}

export function handleValidationError(
  event: ValidationErrorEvent,
  validationContext: {
    isClient: boolean
    showToast?: boolean
    toast: ToastLike
    getElementById: (id: string) => ValidationField | null
  },
) {
  if (!validationContext.isClient || !event?.errors?.length) return

  // Nuxt UI lists errors in its own order, not the page's, so take the
  // invalid field that comes first on the page. It only carries an id for
  // errors it could bind to an input.
  const element = event.errors.reduce<ValidationField | null>((first, error) => {
    const field = error.id ? validationContext.getElementById(error.id) : null

    return field && (!first || comesBefore(field, first)) ? field : first
  }, null)

  // Focusing jumps the page to the field; prevent that so the smooth scroll
  // below moves it instead.
  element?.focus?.({ preventScroll: true })
  if (element && !isOnScreen(element)) {
    element.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  }

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
