import { describe, expect, it } from 'vitest'
import {
  createRegisterValidationSchema,
  createPasswordResetValidationSchema,
} from '../../layers/auth/app/utils/authValidation'

describe('auth validation', () => {
  it('uses configured Drupal password requirements instead of fixed defaults', () => {
    const schema = createRegisterValidationSchema(
      {},
      {
        minLength: 3,
        maxLength: 20,
        requirements: [
          {
            key: 'symbol',
            pattern: '[!@#]',
            label: 'Password must include a symbol',
          },
        ],
      },
    )

    expect(() => schema.validateSync({
      display_name: '',
      email: 'demo@example.test',
      password: 'abc!',
    })).not.toThrow()

    expect(() => schema.validateSync({
      display_name: '',
      email: 'demo@example.test',
      password: 'abc1A',
    })).toThrow('Password must include a symbol')
  })

  it('falls back to the default password requirements without Drupal patterns', () => {
    const schema = createPasswordResetValidationSchema({
      minLength: 8,
      maxLength: 128,
      requirements: [],
    })

    expect(() => schema.validateSync({
      password: 'abcdefgh',
      confirmPassword: 'abcdefgh',
    })).toThrow('Password must include an uppercase letter')
  })
})
