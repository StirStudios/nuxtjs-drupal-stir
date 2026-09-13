import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ACCOUNT_NAV_ITEMS,
  resolveAccountNavItems,
} from '../../layers/auth/app/utils/accountNav'

const none = () => false

describe('resolveAccountNavItems', () => {
  it('returns the default Settings item when nothing is configured', () => {
    const expected = [{ label: 'Settings', icon: 'i-lucide-settings', to: '/account/settings' }]

    expect(resolveAccountNavItems(undefined, none)).toEqual(expected)
    expect(resolveAccountNavItems([], none)).toEqual(expected)
    expect(resolveAccountNavItems('not-a-list', none)).toEqual(expected)
  })

  it('replaces the default with configured items, in order', () => {
    expect(
      resolveAccountNavItems(
        [
          { label: 'Settings', icon: 'i-lucide-settings', to: '/account/settings' },
          { label: 'Profile', to: '/account/profile' },
        ],
        none,
      ),
    ).toEqual([
      { label: 'Settings', icon: 'i-lucide-settings', to: '/account/settings' },
      { label: 'Profile', to: '/account/profile' },
    ])
  })

  it('drops malformed entries and falls back when none are usable', () => {
    expect(
      resolveAccountNavItems(
        [null, { label: '', to: '/x' }, { label: 'No link' }, { label: 'Ok', to: '/ok' }],
        none,
      ),
    ).toEqual([{ label: 'Ok', to: '/ok' }])
    expect(resolveAccountNavItems([{ label: 'No link' }], none)).toHaveLength(
      DEFAULT_ACCOUNT_NAV_ITEMS.length,
    )
  })

  it('shows a keyed item only while its visibility resolves true', () => {
    const items = [
      { label: 'Settings', to: '/account/settings' },
      { label: 'Billing', to: '/account/billing', visibility: 'billing' },
    ]

    expect(resolveAccountNavItems(items, none).map(item => item.label)).toEqual(['Settings'])
    expect(
      resolveAccountNavItems(items, key => key === 'billing').map(item => item.label),
    ).toEqual(['Settings', 'Billing'])
  })

  it('does not leak the visibility key into the navigation item', () => {
    const [item] = resolveAccountNavItems(
      [{ label: 'Billing', to: '/account/billing', visibility: 'billing' }],
      () => true,
    )

    expect(item).toEqual({ label: 'Billing', to: '/account/billing' })
  })
})
