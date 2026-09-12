import { describe, expect, it } from 'vitest'
import {
  resolveStirAuthRedirect,
  safeStirAuthRedirect,
} from '../../layers/auth/app/utils/authRedirect'

describe('resolveStirAuthRedirect', () => {
  it('keeps a same-site path', () => {
    expect(resolveStirAuthRedirect('/account/settings')).toBe('/account/settings')
    expect(resolveStirAuthRedirect('/pricing/checkout?plan=pro')).toBe(
      '/pricing/checkout?plan=pro',
    )
    expect(resolveStirAuthRedirect('/')).toBe('/')
  })

  it.each([
    ['a protocol-relative path', '//evil.com'],
    ['a backslash-escaped host', '/\\evil.com'],
    ['an absolute http URL', 'http://evil.com'],
    ['an absolute https URL', 'https://evil.com'],
    ['a scheme-only target', 'javascript:alert(1)'],
    ['a bare path', 'account/settings'],
  ])('rejects %s', (_label, candidate) => {
    expect(resolveStirAuthRedirect(candidate)).toBe('/')
  })

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a number', 42],
    ['an array of paths', ['/a', '/b']],
    ['an empty string', ''],
    ['whitespace', '   '],
  ])('rejects %s', (_label, candidate) => {
    expect(resolveStirAuthRedirect(candidate)).toBe('/')
  })

  it('rejects a path carrying control characters', () => {
    expect(resolveStirAuthRedirect('/account\nSet-Cookie: x=1')).toBe('/')
  })

  it('falls back when the candidate is unusable', () => {
    expect(resolveStirAuthRedirect(undefined, '/dashboard')).toBe('/dashboard')
    expect(resolveStirAuthRedirect('//evil.com', '/dashboard')).toBe('/dashboard')
  })

  it('holds the fallback to the same rule', () => {
    // The fallback is Drupal-owned configuration, so trusting it blindly would
    // simply move the open redirect rather than close it.
    expect(resolveStirAuthRedirect(undefined, '//evil.com')).toBe('/')
    expect(resolveStirAuthRedirect(undefined, 'https://evil.com')).toBe('/')
    expect(resolveStirAuthRedirect(undefined, '')).toBe('/')
  })

  it('prefers the candidate over the fallback', () => {
    expect(resolveStirAuthRedirect('/gift/redeem/abc', '/dashboard')).toBe(
      '/gift/redeem/abc',
    )
  })
})

describe('safeStirAuthRedirect', () => {
  it('returns the path when it is safe', () => {
    expect(safeStirAuthRedirect('/account/settings')).toBe('/account/settings')
  })

  it.each([
    ['//evil.com'],
    ['https://evil.com'],
    ['account/settings'],
    [''],
    ['   '],
  ])('returns undefined for %s', (candidate) => {
    expect(safeStirAuthRedirect(candidate)).toBeUndefined()
  })

  it('returns undefined rather than a default for a missing value', () => {
    // Callers distinguish "nothing was asked for" from "the default applies".
    expect(safeStirAuthRedirect(undefined)).toBeUndefined()
    expect(safeStirAuthRedirect(['/a', '/b'])).toBeUndefined()
  })
})
