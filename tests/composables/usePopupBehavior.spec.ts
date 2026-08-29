import { describe, expect, it } from 'vitest'
import {
  popupRouteIsSuppressed,
  popupUsesPersistentDismissal,
} from '../../layers/integrations/app/composables/usePopupBehavior'

describe('popup route policy', () => {
  it('suppresses exact transactional paths without hiding their neighbors', () => {
    expect(popupRouteIsSuppressed('/pricing/checkout', ['/pricing/checkout'])).toBe(true)
    expect(popupRouteIsSuppressed('/pricing', ['/pricing/checkout'])).toBe(false)
  })

  it('suppresses a configured route subtree on segment boundaries', () => {
    expect(popupRouteIsSuppressed('/account/settings', [], ['/account'])).toBe(true)
    expect(popupRouteIsSuppressed('/accounting', [], ['/account'])).toBe(false)
  })
})

describe('popup dismissal policy', () => {
  it('persists dismissal for any identifiable popup', () => {
    expect(popupUsesPersistentDismissal({ props: { uuid: 'campaign-id' } })).toBe(true)
    expect(popupUsesPersistentDismissal({ props: { id: 42 } })).toBe(true)
  })

  it('does not persist anonymous popup state under a shared fallback key', () => {
    expect(popupUsesPersistentDismissal({ props: {} })).toBe(false)
    expect(popupUsesPersistentDismissal(null)).toBe(false)
  })
})
