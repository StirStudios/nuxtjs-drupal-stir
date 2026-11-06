import { describe, expect, it } from 'vitest'
import { isPathIgnored } from '../../layers/foundation/app/utils/pathMatch'

describe('isPathIgnored', () => {
  it('matches exact paths ignoring trailing slashes', () => {
    expect(isPathIgnored('/pricing/checkout/', ['/pricing/checkout'])).toBe(true)
    expect(isPathIgnored('/pricing', ['/pricing/checkout'])).toBe(false)
  })

  it('matches prefixes on segment boundaries and never a bare slash', () => {
    expect(isPathIgnored('/account/edit', [], ['/account'])).toBe(true)
    expect(isPathIgnored('/accounts', [], ['/account'])).toBe(false)
    expect(isPathIgnored('/anything', [], ['/'])).toBe(false)
  })
})
