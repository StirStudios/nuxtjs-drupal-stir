import { describe, expect, it } from 'vitest'
import {
  isInheritedRevealEffect,
  resolveScopedRevealEffect,
} from '../../layers/theme/app/composables/useRevealMotionScope'
import { REVEAL_DEFAULTS } from '../../layers/theme/app/composables/useRevealMotionConfig'

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

  it('distinguishes inherited values from explicit opt-outs', () => {
    expect(isInheritedRevealEffect(undefined)).toBe(true)
    expect(isInheritedRevealEffect('inherit')).toBe(true)
    expect(isInheritedRevealEffect('default')).toBe(true)
    expect(isInheritedRevealEffect('off')).toBe(false)
    expect(isInheritedRevealEffect('fade-up')).toBe(false)
  })

  it('uses the balanced site-wide reveal timing profile', () => {
    expect(REVEAL_DEFAULTS).toMatchObject({
      durationMs: 800,
      distancePx: 60,
      staggerMs: 100,
      ease: [0.16, 1, 0.3, 1],
      threshold: 0.12,
      rootMargin: '0px 0px -15% 0px',
    })
  })
})
