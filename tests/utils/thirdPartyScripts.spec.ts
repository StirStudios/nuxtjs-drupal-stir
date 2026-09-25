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
    const allowed = ['https://*.piperavenue.com']

    expect(resolveAllowedScriptUrl('https://assets.piperavenue.com/widgets/piper-loader.js', allowed))
      .toBe('https://assets.piperavenue.com/widgets/piper-loader.js')
    expect(resolveAllowedScriptUrl('https://app.dev.piperavenue.com/loader.js', allowed))
      .toBe('https://app.dev.piperavenue.com/loader.js')
    expect(resolveAllowedScriptUrl('https://evil-piperavenue.com/loader.js', allowed)).toBe('')
    expect(resolveAllowedScriptUrl('https://piperavenue.com.evil.com/loader.js', allowed)).toBe('')
    expect(resolveAllowedScriptUrl('https://piperavenue.com/loader.js', allowed)).toBe('')
    expect(resolveAllowedScriptUrl('http://assets.piperavenue.com/loader.js', allowed)).toBe('')
    expect(resolveAllowedScriptUrl('https://assets.piperavenue.com:8443/loader.js', allowed)).toBe('')
  })

  it('keeps exact origins and wildcards working together', () => {
    const allowed = ['https://piper.b-cdn.net', 'https://*.piperavenue.com']

    expect(resolveAllowedScriptUrl('https://piper.b-cdn.net/loader.js', allowed))
      .toBe('https://piper.b-cdn.net/loader.js')
    expect(resolveAllowedScriptUrl('https://sub.piper.b-cdn.net/loader.js', allowed)).toBe('')
  })
})
