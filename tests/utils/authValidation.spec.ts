import { describe, expect, it } from 'vitest'
import { parse } from 'valibot'
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

    expect(parse(schema, { password, confirmPassword: password })).toEqual({
      password,
      confirmPassword: password,
    })
  })

  it('does not trim valid whitespace-only passwords before Drupal policy checks', () => {
    const schema = createPasswordResetValidationSchema({ minLength: 3 })

    expect(parse(schema, {
      password: '   ',
      confirmPassword: '   ',
    })).toEqual({
      password: '   ',
      confirmPassword: '   ',
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

    expect(() => parse(schema, {
      display_name: '',
      email: 'demo@example.test',
      password: 'abc!',
    })).not.toThrow()

    expect(() => parse(schema, {
      display_name: '',
      email: 'demo@example.test',
      password: 'abc1A',
    })).toThrow('Password must include a symbol')
  })

  it('does not invent password requirements when Drupal sends none', () => {
    const schema = createPasswordResetValidationSchema({
      requirements: [],
    })

    expect(() => parse(schema, {
      password: 'abcdefgh',
      confirmPassword: 'abcdefgh',
    })).not.toThrow()
  })
})
