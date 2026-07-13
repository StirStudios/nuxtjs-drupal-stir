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
})
