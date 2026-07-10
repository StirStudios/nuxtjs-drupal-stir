import { describe, expect, it } from 'vitest'
import {
  createRegisterValidationSchema,
  createPasswordResetValidationSchema,
} from '../../layers/auth/app/utils/authValidation'

describe('auth validation', () => {
  it('preserves whitespace in passwords', () => {
    const schema = createPasswordResetValidationSchema({
      minLength: 8,
      maxLength: 128,
    })
    const password = ' Password1 '

    expect(schema.validateSync({ password, confirmPassword: password })).toEqual({
      password,
      confirmPassword: password,
    })
  })

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

  it('does not invent password requirements when Drupal sends none', () => {
    const schema = createPasswordResetValidationSchema({
      requirements: [],
    })

    expect(() => schema.validateSync({
      password: 'abcdefgh',
      confirmPassword: 'abcdefgh',
    })).not.toThrow()
  })
})
