import { describe, expect, it } from 'vitest'
import {
  normalizeScriptOrigin,
  resolveAllowedScriptUrl,
} from '../../layers/theme/app/composables/useThirdPartyScript'

describe('third-party script URLs', () => {
  it('accepts HTTPS URLs from an explicitly allowed origin', () => {
    expect(
      resolveAllowedScriptUrl(
        'https://app.enzuzo.com/scripts/privacy/example',
        ['https://app.enzuzo.com'],
      ),
    ).toBe('https://app.enzuzo.com/scripts/privacy/example')
  })

  it('rejects arbitrary origins and insecure protocols', () => {
    expect(
      resolveAllowedScriptUrl(
        'https://malicious.example/widget.js',
        ['https://app.enzuzo.com'],
      ),
    ).toBe('')
    expect(
      resolveAllowedScriptUrl(
        'http://app.enzuzo.com/widget.js',
        ['https://app.enzuzo.com'],
      ),
    ).toBe('')
    expect(normalizeScriptOrigin('javascript:alert(1)')).toBe('')
  })

  it('does not allow sibling or lookalike hostnames', () => {
    expect(
      resolveAllowedScriptUrl(
        'https://evil.app.enzuzo.com.example/widget.js',
        ['https://app.enzuzo.com'],
      ),
    ).toBe('')
  })

  it('matches a subdomain wildcard only on an HTTPS subdomain at a dot boundary', () => {
    const allowed = ['https://*.example.com']

    expect(resolveAllowedScriptUrl('https://assets.example.com/widgets/loader.js', allowed))
      .toBe('https://assets.example.com/widgets/loader.js')
    expect(resolveAllowedScriptUrl('https://app.dev.example.com/loader.js', allowed))
      .toBe('https://app.dev.example.com/loader.js')
    expect(resolveAllowedScriptUrl('https://evil-example.com/loader.js', allowed)).toBe('')
    expect(resolveAllowedScriptUrl('https://example.com.evil.com/loader.js', allowed)).toBe('')
    expect(resolveAllowedScriptUrl('https://example.com/loader.js', allowed)).toBe('')
    expect(resolveAllowedScriptUrl('http://assets.example.com/loader.js', allowed)).toBe('')
    expect(resolveAllowedScriptUrl('https://assets.example.com:8443/loader.js', allowed)).toBe('')
  })

  it('keeps exact origins and wildcards working together', () => {
    const allowed = ['https://cdn.example.net', 'https://*.example.com']

    expect(resolveAllowedScriptUrl('https://cdn.example.net/loader.js', allowed))
      .toBe('https://cdn.example.net/loader.js')
    expect(resolveAllowedScriptUrl('https://sub.cdn.example.net/loader.js', allowed)).toBe('')
  })
})
