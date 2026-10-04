import { describe, expect, it, vi } from 'vitest'
import { handleValidationError } from '../../layers/foundation/app/composables/useValidation'

describe('handleValidationError', () => {
  it('focuses and scrolls the first errored field and emits a toast', () => {
    const focus = vi.fn()
    const scrollIntoView = vi.fn()
    const add = vi.fn()

    handleValidationError(
      {
        errors: [
          { id: 'email', message: 'Required' },
          { id: 'name', message: 'Required' },
        ],
      },
      {
        isClient: true,
        showToast: true,
        toast: { add },
        getElementById: (id) =>
          id === 'email'
            ? {
                focus,
                scrollIntoView,
              }
            : null,
      },
    )

    expect(focus).toHaveBeenCalledTimes(1)
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    })
    expect(add).toHaveBeenCalledTimes(1)
  })

  it('focuses the invalid field that comes first on the page, not first in the list', () => {
    const contactFocus = vi.fn()
    const guestFocus = vi.fn()
    const guestScroll = vi.fn()
    // The guest count field comes before the contact field on the page.
    const guest = { focus: guestFocus, scrollIntoView: guestScroll, compareDocumentPosition: () => 4 }
    const contact = { focus: contactFocus, compareDocumentPosition: () => 2 }

    handleValidationError(
      {
        errors: [
          { id: 'contact', message: 'Required' },
          { id: 'guests', message: 'Required' },
        ],
      },
      {
        isClient: true,
        showToast: false,
        toast: { add: vi.fn() },
        getElementById: id => (id === 'guests' ? guest : contact),
      },
    )

    expect(guestFocus).toHaveBeenCalledTimes(1)
    expect(guestScroll).toHaveBeenCalledTimes(1)
    expect(contactFocus).not.toHaveBeenCalled()
  })

  it('only focuses a field that is already on screen', () => {
    const focus = vi.fn()
    const scrollIntoView = vi.fn()

    vi.stubGlobal('window', { innerHeight: 800 })

    handleValidationError(
      { errors: [{ id: 'name', message: 'Required' }] },
      {
        isClient: true,
        showToast: false,
        toast: { add: vi.fn() },
        getElementById: () => ({ focus, scrollIntoView, getBoundingClientRect: () => ({ top: 500, bottom: 540 }) }),
      },
    )

    expect(focus).toHaveBeenCalledTimes(1)
    expect(scrollIntoView).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('does nothing on server-side execution', () => {
    const add = vi.fn()
    const getElementById = vi.fn()

    handleValidationError(
      {
        errors: [{ id: 'email', message: 'Required' }],
      },
      {
        isClient: false,
        showToast: true,
        toast: { add },
        getElementById,
      },
    )

    expect(add).not.toHaveBeenCalled()
    expect(getElementById).not.toHaveBeenCalled()
  })

  it('emits a toast by default when showToast is omitted', () => {
    const add = vi.fn()

    handleValidationError(
      {
        errors: [{ id: 'email', message: 'Required' }],
      },
      {
        isClient: true,
        toast: { add },
        getElementById: () => null,
      },
    )

    expect(add).toHaveBeenCalledTimes(1)
  })
})
