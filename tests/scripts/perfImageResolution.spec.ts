import { describe, expect, it } from 'vitest'
import { classifyImage, neededWidth } from '../../scripts/perf/imageResolution.mjs'

const image = (overrides: Record<string, unknown> = {}) => ({
  boxWidth: 1400,
  boxHeight: 560,
  aspectRatio: 4000 / 772,
  cover: true,
  deliveredWidth: 3317,
  largestWidth: 4000,
  ...overrides,
})

describe('image resolution audit', () => {
  it('needs the shown width of a cover image wider than its box', () => {
    expect(neededWidth(image(), 1)).toBe(2902)
    expect(neededWidth(image({ cover: false }), 1)).toBe(1400)
    expect(neededWidth(image({ aspectRatio: 1 }), 1)).toBe(1400)
  })

  it('caps the device pixel ratio at 2', () => {
    expect(neededWidth(image({ cover: false, boxWidth: 390 }), 3)).toBe(780)
  })

  it('passes an image delivered at its shown size', () => {
    expect(classifyImage(image(), 1)).toBeUndefined()
  })

  it('reports a code fault when a larger candidate was available', () => {
    // The panorama before the fix: 1200px chosen though 2400px was in srcset.
    expect(classifyImage(image({ deliveredWidth: 1200, largestWidth: 2400 }), 1))
      .toEqual({ level: 'error', needed: 2902, available: 2400 })
  })

  it('reports only a warning when the source itself is too small', () => {
    expect(classifyImage(image({ cover: false, boxWidth: 1920, deliveredWidth: 1024, largestWidth: 1024 }), 1))
      .toEqual({ level: 'warning', needed: 1920, available: 1024 })
  })

  it('ignores icons and images that never loaded', () => {
    expect(classifyImage(image({ boxWidth: 40, deliveredWidth: 10 }), 1)).toBeUndefined()
    expect(classifyImage(image({ deliveredWidth: 0 }), 1)).toBeUndefined()
  })
})
