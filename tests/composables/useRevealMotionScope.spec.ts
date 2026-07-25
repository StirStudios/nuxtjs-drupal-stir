import { describe, expect, it } from 'vitest'
import { resolveScopedRevealEffect } from '../../layers/theme/app/composables/useRevealMotionScope'

describe('resolveScopedRevealEffect', () => {
  it('inherits when an element has no explicit animation', () => {
    expect(resolveScopedRevealEffect(undefined, 'fade-up')).toBe('fade-up')
    expect(resolveScopedRevealEffect('inherit', 'zoom-in')).toBe('zoom-in')
  })

  it('allows an element to override or disable inherited motion', () => {
    expect(resolveScopedRevealEffect('slide-left', 'fade-up')).toBe('slide-left')
    expect(resolveScopedRevealEffect('off', 'fade-up')).toBeUndefined()
    expect(resolveScopedRevealEffect('none', 'fade-up')).toBeUndefined()
  })
})
