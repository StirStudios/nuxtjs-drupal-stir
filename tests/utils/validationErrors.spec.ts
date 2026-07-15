import { describe, expect, it } from 'vitest'
import { createPasswordResetValidationSchema } from '../../layers/auth/app/utils/authValidation'
import { validateForm } from '../../layers/auth/app/utils/validationErrors'

describe('validationErrors', () => {
  it('maps Valibot issues to Nuxt UI field errors', () => {
    const errors = validateForm(
      createPasswordResetValidationSchema({ minLength: 8 }),
      { password: 'short', confirmPassword: 'different' },
    )

    expect(errors).toEqual([
      {
        name: 'password',
        message: 'Password must be at least 8 characters',
      },
    ])
  })

  it('maps forwarded cross-field issues to the affected field', () => {
    expect(validateForm(
      createPasswordResetValidationSchema({ minLength: 8 }),
      { password: 'Password1', confirmPassword: 'Password2' },
    )).toEqual([{
      name: 'confirmPassword',
      message: 'Passwords do not match',
    }])
  })

  it('returns no errors for valid input', () => {
    expect(validateForm(
      createPasswordResetValidationSchema({ minLength: 8 }),
      { password: 'Password1', confirmPassword: 'Password1' },
    )).toEqual([])
  })
})
