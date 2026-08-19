import { describe, expect, it } from 'vitest'
import {
  normalizeWebformConfirmationType,
  resolveWebformRedirect,
} from '../../layers/webform/app/utils/webformRedirect'

describe('normalizeWebformConfirmationType', () => {
  it('preserves the supported confirmation types', () => {
    expect(normalizeWebformConfirmationType('inline')).toBe('inline')
    expect(normalizeWebformConfirmationType('url')).toBe('url')
  })

  it.each([
    'page',
    'message',
    'modal',
    'url_message',
    'none',
    '',
    null,
    undefined,
    'unknown',
  ])('defaults unsupported confirmation type %s to inline', (type) => {
    expect(normalizeWebformConfirmationType(type)).toBe('inline')
  })
})

describe('resolveWebformRedirect', () => {
  it('accepts a root-relative Drupal confirmation URL', () => {
    expect(resolveWebformRedirect('url', '/thanks')).toEqual({
      to: '/thanks',
      external: false,
    })
  })

  it('accepts an explicit HTTP or HTTPS confirmation URL', () => {
    expect(resolveWebformRedirect('url', 'https://example.com/thanks')).toEqual({
      to: 'https://example.com/thanks',
      external: true,
    })
  })

  it.each([
    ['inline', '/thanks'],
    ['page', '/thanks'],
    ['message', '/thanks'],
    ['modal', '/thanks'],
    ['url_message', '/thanks'],
    ['none', '/thanks'],
    ['url', 'javascript:alert(1)'],
    ['url', '//example.com/thanks'],
    ['url', 'relative/path'],
    ['url', null],
  ])('rejects an unsupported redirect %#', (type, redirect) => {
    expect(resolveWebformRedirect(type, redirect)).toBeNull()
  })
})
