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

  it('supports first-paint brand colors before inheriting Nuxt UI fallbacks', () => {
    expect(template).toContain('var(--stir-loader-primary, var(--ui-primary, #64748b))')
    expect(template).toContain('var(--stir-loader-secondary, var(--ui-secondary, #94a3b8))')
    expect(template).toContain('var(--stir-loader-bg, var(--ui-bg, #f8fafc))')
    expect(template).toContain('var(--stir-loader-text, var(--ui-text, #334155))')
    expect(template).toContain('var(--stir-loader-text-toned, var(--ui-text-toned, #475569))')
    expect(template).toContain('var(--stir-loader-text-muted, var(--ui-text-muted, #64748b))')
  })
})
