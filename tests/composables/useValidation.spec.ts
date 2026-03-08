import { describe, expect, it, vi } from 'vitest'
import { handleValidationError } from '../../app/composables/useValidation'

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
})
