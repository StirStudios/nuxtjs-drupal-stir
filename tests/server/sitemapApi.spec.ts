import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { drupalApiRequest } from '../../layers/core/server/utils/drupalApi'
import {
  fetchSitemap,
  parseSitemapResponse,
} from '../../layers/core/server/utils/sitemapApi'

vi.mock('../../layers/core/server/utils/drupalApi', () => ({
  drupalApiRequest: vi.fn(),
}))

const producerFixture = () => JSON.parse(readFileSync(resolve(
  __dirname,
  '../../contracts/stir-tools/v1/fixtures/sitemap.json',
), 'utf8'))

describe('sitemapApi', () => {
  beforeEach(() => {
    vi.mocked(drupalApiRequest).mockReset()
  })

  it('parses the synchronized producer fixture through the production boundary', () => {
    const fixture = producerFixture()

    expect(parseSitemapResponse(fixture)).toEqual(fixture)
  })

  it('rejects malformed and undocumented entry data', () => {
    expect(() => parseSitemapResponse([{
      loc: '/example',
      lastmod: null,
      changefreq: null,
      priority: null,
      legacy: true,
    }])).toThrow('Invalid Drupal sitemap contract at 0')

    expect(() => parseSitemapResponse([{
      loc: '',
      lastmod: null,
      changefreq: null,
      priority: null,
    }])).toThrow('Invalid Drupal sitemap contract at 0.loc')
  })

  it('fetches the public sitemap without forwarding visitor cookies', async () => {
    const fixture = producerFixture()

    vi.mocked(drupalApiRequest).mockResolvedValue(fixture)
    const event = {} as Parameters<typeof fetchSitemap>[0]

    await expect(fetchSitemap(event)).resolves.toEqual(fixture)
    expect(drupalApiRequest).toHaveBeenCalledWith(event, '/api/sitemap', {
      method: 'GET',
    })
  })
})
