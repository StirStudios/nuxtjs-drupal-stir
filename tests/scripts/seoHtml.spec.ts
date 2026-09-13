import { describe, expect, it } from 'vitest'
import { attributes, crawlableUrl, hasNoindex, readUrlArgument, resolveSiteUrl } from '../../scripts/seo/html.mjs'

describe('SEO HTML inspection', () => {
  it('reads quoted, unquoted, boolean, and encoded attributes', () => {
    expect(attributes('<img src="/image?a=1&amp;b=2" alt="Venue" loading=lazy hidden>')).toEqual({
      alt: 'Venue',
      hidden: '',
      loading: 'lazy',
      src: '/image?a=1&b=2',
    })
  })

  it('normalizes crawlable links and ignores non-network schemes', () => {
    expect(crawlableUrl('/pricing#details', 'https://example.com')?.href).toBe('https://example.com/pricing')
    expect(crawlableUrl('mailto:events@example.com', 'https://example.com')).toBeNull()
  })

  it('recognizes noindex as a complete robots token', () => {
    expect(hasNoindex('nofollow, noindex')).toBe(true)
    expect(hasNoindex('index, follow')).toBe(false)
  })

  it('reads the audit origin only from an explicit --url argument', () => {
    expect(readUrlArgument(['--url', 'http://127.0.0.1:3000'])).toBe('http://127.0.0.1:3000')
    expect(readUrlArgument(['--', '--url=https://staging.example.com'])).toBe('https://staging.example.com')
    expect(readUrlArgument(['--verbose'])).toBe('')
  })

  it('resolves the audit origin from an override or the compliance inventory', () => {
    expect(resolveSiteUrl('http://127.0.0.1:3040/path', {})).toBe('http://127.0.0.1:3040')
    expect(resolveSiteUrl('', { owner: { domain: 'www.example.com' } })).toBe('https://www.example.com')
    expect(resolveSiteUrl('', {})).toBe('')
  })
})
