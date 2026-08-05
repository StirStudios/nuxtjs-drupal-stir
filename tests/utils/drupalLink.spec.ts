import { describe, expect, it } from 'vitest'
import { resolveDrupalLink } from '../../layers/theme/app/utils/drupalLink'

describe('resolveDrupalLink', () => {
  it('normalizes explicit and nested Drupal link payloads', () => {
    expect(resolveDrupalLink({
      props: {
        label: 'Explore warehousing',
        url: '/services/warehousing',
      },
    })).toEqual({
      title: 'Explore warehousing',
      url: '/services/warehousing',
      external: false,
    })
  })

  it('detects external absolute links unless Drupal supplies the flag', () => {
    expect(resolveDrupalLink({ url: 'https://example.com' }).external).toBe(true)
    expect(resolveDrupalLink({ external: false, url: 'https://example.com' }).external).toBe(false)
  })
})
