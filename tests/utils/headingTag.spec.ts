import { describe, expect, it } from 'vitest'
import { resolveHeadingTag } from '../../layers/theme/app/utils/headingTag'

describe('headingTag', () => {
  it('passes through tags on the Drupal allowlist', () => {
    expect(resolveHeadingTag('h2')).toBe('h2')
    expect(resolveHeadingTag('h3')).toBe('h3')
    expect(resolveHeadingTag('h4')).toBe('h4')
    expect(resolveHeadingTag('div')).toBe('div')
    expect(resolveHeadingTag('span')).toBe('span')
  })

  it('falls back to h2 by default for unexpected tags', () => {
    expect(resolveHeadingTag('h1')).toBe('h2')
    expect(resolveHeadingTag('h5')).toBe('h2')
    expect(resolveHeadingTag('script')).toBe('h2')
    expect(resolveHeadingTag(undefined)).toBe('h2')
    expect(resolveHeadingTag(null)).toBe('h2')
    expect(resolveHeadingTag('')).toBe('h2')
  })

  it('falls back to a caller-supplied default', () => {
    expect(resolveHeadingTag('script', 'h3')).toBe('h3')
    expect(resolveHeadingTag(undefined, 'h3')).toBe('h3')
  })
})
