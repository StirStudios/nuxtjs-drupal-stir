import { describe, expect, it } from 'vitest'
import {
  activePopupDismissals,
  popupSuppressionIsActive,
  popupUsesPersistentDismissal,
  resolvePopupTrigger,
} from '../../layers/integrations/app/composables/usePopupBehavior'

describe('popup dismissal policy', () => {
  it('persists dismissal for any identifiable popup', () => {
    expect(popupUsesPersistentDismissal({ props: { uuid: 'campaign-id' } })).toBe(true)
    expect(popupUsesPersistentDismissal({ props: { id: 42 } })).toBe(true)
  })

  it('does not persist anonymous popup state under a shared fallback key', () => {
    expect(popupUsesPersistentDismissal({ props: {} })).toBe(false)
    expect(popupUsesPersistentDismissal(null)).toBe(false)
  })

  it('expires dismissals but retains completed campaigns', () => {
    expect(popupSuppressionIsActive(2_000, 1_000)).toBe(true)
    expect(popupSuppressionIsActive(1_000, 2_000)).toBe(false)
    expect(popupSuppressionIsActive('completed', 2_000)).toBe(true)
  })

  it('keeps stored dismissals from accumulating once they expire', () => {
    expect(activePopupDismissals({
      expired: 1_000,
      pending: 3_000,
      finished: 'completed',
    }, 2_000)).toEqual({ pending: 3_000, finished: 'completed' })
  })
})

describe('popup trigger selection', () => {
  it('keeps the configured trigger on larger screens', () => {
    expect(resolvePopupTrigger('exit', 'scroll', false)).toBe('exit')
    expect(resolvePopupTrigger('scroll', 'delay', false)).toBe('scroll')
    expect(resolvePopupTrigger('bogus', undefined, false)).toBe('delay')
  })

  it('uses the phone trigger below md', () => {
    expect(resolvePopupTrigger('delay', 'scroll', true)).toBe('scroll')
    expect(resolvePopupTrigger('scroll', 'delay', true)).toBe('delay')
  })

  it('falls back to the popup trigger on phones when none is set', () => {
    expect(resolvePopupTrigger('delay', undefined, true)).toBe('delay')
    expect(resolvePopupTrigger('scroll', undefined, true)).toBe('scroll')
  })

  it('treats exit intent as scroll on phones', () => {
    expect(resolvePopupTrigger('exit', undefined, true)).toBe('scroll')
  })
})
