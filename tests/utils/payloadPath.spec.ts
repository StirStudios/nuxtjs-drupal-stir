import { describe, expect, it } from 'vitest'
import { displayedPayloadPath } from '../../layers/theme/app/utils/payloadPath'

describe('displayedPayloadPath', () => {
  it('uses the encoded path the browser shows for the same page', () => {
    expect(displayedPayloadPath('/café', { pathname: '/caf%C3%A9', search: '?a=1' }, '/'))
      .toBe('/caf%C3%A9?a=1')
  })

  it('ignores a trailing slash and strips the app base', () => {
    expect(displayedPayloadPath('/about/', { pathname: '/app/about', search: '' }, '/app/'))
      .toBe('/about')
  })

  it('leaves a different page alone', () => {
    expect(displayedPayloadPath('/about', { pathname: '/contact', search: '' }, '/')).toBeNull()
  })

  it('compares malformed encodings as they are', () => {
    expect(displayedPayloadPath('/%E0%A4%A', { pathname: '/%E0%A4%A', search: '' }, '/'))
      .toBe('/%E0%A4%A')
  })
})
