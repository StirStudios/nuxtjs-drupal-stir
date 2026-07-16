import { describe, expect, it } from 'vitest'
import { resolveWebformRedirect } from '../../layers/webform/app/utils/webformRedirect'

describe('resolveWebformRedirect', () => {
  it('accepts a root-relative Drupal confirmation URL', () => {
    expect(resolveWebformRedirect('url', '/thanks')).toEqual({
      to: '/thanks',
      external: false,
    })
  })

  it('maps Drupal url_message front-page redirects to Nuxt root', () => {
    expect(resolveWebformRedirect('url_message', '<front>')).toEqual({
      to: '/',
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
    ['message', '/thanks'],
    ['url', 'javascript:alert(1)'],
    ['url', '//example.com/thanks'],
    ['url', 'relative/path'],
    ['url', null],
  ])('rejects an unsupported redirect %#', (type, redirect) => {
    expect(resolveWebformRedirect(type, redirect)).toBeNull()
  })
})
