import { describe, expect, it } from 'vitest'
import {
  getFetchErrorCode,
  getFetchErrorMessage,
} from '../../layers/auth/app/utils/fetchError'

// The shape ofetch rejects with when a Nitro route throws createError().
const nitroError = (body: Record<string, unknown>, statusMessage = '') => ({
  statusCode: 401,
  statusMessage,
  data: { error: true, statusCode: 401, ...body },
})

describe('getFetchErrorMessage', () => {
  it('reads the message Nitro serialised from the proxy error', () => {
    expect(getFetchErrorMessage(nitroError({
      statusMessage: 'The email or password is incorrect.',
      message: 'The email or password is incorrect.',
    }), 'Sign-in failed.')).toBe('The email or password is incorrect.')
  })

  it('reads the body when the HTTP/2 status text is empty', () => {
    expect(getFetchErrorMessage(nitroError({
      message: 'Please verify your email address before signing in.',
    }), 'Sign-in failed.')).toBe('Please verify your email address before signing in.')
  })

  it('prefers a string error returned as is by a route', () => {
    expect(getFetchErrorMessage({
      statusMessage: 'Unauthorized',
      data: { error: 'Too many attempts.', message: 'Other' },
    })).toBe('Too many attempts.')
  })

  it('ignores the boolean Nitro error flag', () => {
    expect(getFetchErrorMessage(nitroError({}, 'Unauthorized'), 'Sign-in failed.'))
      .toBe('Unauthorized')
  })

  it('falls back when nothing usable is present', () => {
    expect(getFetchErrorMessage(nitroError({ message: '  ' }), 'Sign-in failed.'))
      .toBe('Sign-in failed.')
    expect(getFetchErrorMessage(new TypeError('fetch failed'), 'Sign-in failed.'))
      .toBe('Sign-in failed.')
    expect(getFetchErrorMessage(null)).toBe('Request failed.')
  })
})

describe('getFetchErrorCode', () => {
  it('reads the code the proxy forwarded under the body data', () => {
    expect(getFetchErrorCode(nitroError({
      data: { code: 'verification_required' },
    }))).toBe('verification_required')
  })

  it('reads a code returned directly in the body', () => {
    expect(getFetchErrorCode({ data: { code: 'invalid_credentials' } }))
      .toBe('invalid_credentials')
  })

  it('returns an empty string without a code', () => {
    expect(getFetchErrorCode(nitroError({}))).toBe('')
    expect(getFetchErrorCode(undefined)).toBe('')
  })
})
