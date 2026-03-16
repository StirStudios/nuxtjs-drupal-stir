import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  createScrollToTopRunner,
  getWebformScrollConfig,
} from '../../app/utils/webformScrollToTop'

describe('webformScrollToTop', () => {
  it('normalizes config defaults and overrides', () => {
    expect(getWebformScrollConfig(undefined)).toEqual({
      scrollToTopOnSuccess: true,
      scrollToTopOnReset: true,
      scrollToTopDelayMs: 0,
      scrollToTopFallbackDelayMs: 180,
    })

    expect(
      getWebformScrollConfig({
        scrollToTopOnSuccess: false,
        scrollToTopOnReset: false,
        scrollToTopDelayMs: '50',
        scrollToTopFallbackDelayMs: -100,
      }),
    ).toEqual({
      scrollToTopOnSuccess: false,
      scrollToTopOnReset: false,
      scrollToTopDelayMs: 50,
      scrollToTopFallbackDelayMs: 0,
    })
  })

  describe('createScrollToTopRunner', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.restoreAllMocks()
    })

    it('applies primary scroll immediately and fallback after configured delay', () => {
      const y = { value: 999 }
      const scrollToSpy = vi.fn()
      const testWindow = { scrollTo: scrollToSpy }

      const runner = createScrollToTopRunner({
        y,
        getDelayMs: () => 0,
        getFallbackDelayMs: () => 180,
        getWindow: () => testWindow,
      })

      runner.run()

      expect(y.value).toBe(0)
      expect(scrollToSpy).not.toHaveBeenCalled()

      vi.advanceTimersByTime(180)

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
    })

    it('cancels pending timers on cleanup to avoid late scroll jumps', () => {
      const y = { value: 999 }
      const scrollToSpy = vi.fn()
      const testWindow = { scrollTo: scrollToSpy }

      const runner = createScrollToTopRunner({
        y,
        getDelayMs: () => 50,
        getFallbackDelayMs: () => 180,
        getWindow: () => testWindow,
      })

      runner.run()
      runner.cleanup()
      vi.runAllTimers()

      expect(y.value).toBe(999)
      expect(scrollToSpy).not.toHaveBeenCalled()
    })
  })
})
