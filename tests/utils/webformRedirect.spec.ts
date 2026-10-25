import { describe, expect, it } from 'vitest'
import {
  normalizeWebformConfirmationType,
  resolveSubmissionMessage,
  resolveSubmissionRedirect,
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

describe('resolveSubmissionRedirect', () => {
  it('prefers the confirmation URL Drupal resolved for the submission', () => {
    expect(resolveSubmissionRedirect(
      { sid: 'a', confirmation_type: 'url', confirmation_url: 'https://example.com/book?at=10' },
      'url',
      '[webform_submission:values:link]',
    )).toEqual({ to: 'https://example.com/book?at=10', external: true })
  })

  it('falls back to the form redirect when the response has no confirmation URL', () => {
    expect(resolveSubmissionRedirect({ sid: 'a' }, 'url', '/thanks')).toEqual({ to: '/thanks', external: false })
    expect(resolveSubmissionRedirect(undefined, 'url', '/thanks')).toEqual({ to: '/thanks', external: false })
  })

  it('stays inline for an inline confirmation', () => {
    expect(resolveSubmissionRedirect({ confirmation_type: 'message', confirmation_url: '' }, 'inline', '/thanks')).toBeNull()
  })

  it('rejects a resolved URL that is not HTTP or root-relative', () => {
    expect(resolveSubmissionRedirect({ confirmation_type: 'url', confirmation_url: 'javascript:alert(1)' }, 'url', '/thanks')).toBeNull()
  })
})

describe('resolveSubmissionMessage', () => {
  it('prefers the message Drupal resolved for the submission', () => {
    expect(resolveSubmissionMessage({ confirmation_message: '<p>Thanks, Ada.</p>' }, '<p>Thanks, [name].</p>')).toBe('<p>Thanks, Ada.</p>')
  })

  it('falls back to the form message without one', () => {
    expect(resolveSubmissionMessage({ sid: '1' }, 'Sent.')).toBe('Sent.')
    expect(resolveSubmissionMessage({ confirmation_message: '  ' }, 'Sent.')).toBe('Sent.')
    expect(resolveSubmissionMessage(null, 'Sent.')).toBe('Sent.')
  })
})
