import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const template = readFileSync(
  new URL('../../layers/theme/app/spa-loading-template.html', import.meta.url),
  'utf8',
)

describe('SPA loading template', () => {
  it('provides an accessible status while authenticated SSR is disabled', () => {
    expect(template).toContain('role="status"')
    expect(template).toContain('aria-live="polite"')
    expect(template).toContain('aria-atomic="true"')
    expect(template).toContain('>Loading</p>')
  })

  it('works without external assets and respects reduced motion', () => {
    expect(template).not.toMatch(/<(?:img|script|link)\b/i)
    expect(template).toContain('@media (prefers-reduced-motion: reduce)')
    expect(template).toContain('min-height: 100dvh')
  })
})
