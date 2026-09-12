import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { stirDrupalApiRequest } from '../../layers/foundation/server/utils/stirDrupalApi'
import {
  fetchSitemap,
  parseSitemapResponse,
} from '../../layers/seo/server/utils/sitemapApi'

vi.mock('../../layers/foundation/server/utils/stirDrupalApi', () => ({
  stirDrupalApiRequest: vi.fn(),
}))

const producerFixture = () => JSON.parse(readFileSync(resolve(
  __dirname,
  '../../contracts/stir-tools/v1/fixtures/sitemap.json',
), 'utf8'))

describe('sitemapApi', () => {
  beforeEach(() => {
    vi.mocked(stirDrupalApiRequest).mockReset()
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

    vi.mocked(stirDrupalApiRequest).mockResolvedValue(fixture)
    const event = {} as Parameters<typeof fetchSitemap>[0]

    await expect(fetchSitemap(event)).resolves.toEqual(fixture)
    expect(stirDrupalApiRequest).toHaveBeenCalledWith(event, '/api/sitemap', {
      method: 'GET',
    })
  })
})
