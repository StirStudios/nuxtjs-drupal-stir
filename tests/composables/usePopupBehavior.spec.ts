import { describe, expect, it } from 'vitest'
import { popupRouteIsSuppressed } from '../../layers/integrations/app/composables/usePopupBehavior'

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
