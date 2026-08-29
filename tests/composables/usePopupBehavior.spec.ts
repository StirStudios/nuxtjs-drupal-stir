import { describe, expect, it } from 'vitest'
import {
  popupSuppressionIsActive,
  popupUsesPersistentDismissal,
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
})
