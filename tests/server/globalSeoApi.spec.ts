import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { drupalApiRequest } from '../../layers/core/server/utils/drupalApi'
import {
  fetchGlobalSeo,
  parseGlobalSeoResponse,
} from '../../layers/core/server/utils/globalSeoApi'

vi.mock('../../layers/core/server/utils/drupalApi', () => ({
  drupalApiRequest: vi.fn(),
}))

describe('globalSeoApi', () => {
  beforeEach(() => {
    vi.mocked(drupalApiRequest).mockReset()
  })

  it('parses the synchronized producer fixture through the production boundary', () => {
    const fixture = JSON.parse(readFileSync(resolve(
      __dirname,
      '../../contracts/stir-tools/v1/fixtures/global-seo.json',
    ), 'utf8'))

    expect(parseGlobalSeoResponse(fixture)).toEqual(fixture)
  })

  it('rejects malformed attribute values before they reach Nuxt head', () => {
    expect(() => parseGlobalSeoResponse({
      lang: 'en',
      meta: [{ name: 'robots', content: true }],
      link: [],
    })).toThrow('Invalid Drupal global SEO contract at meta.0.content')
  })

  it('returns the contract payload from Drupal', async () => {
    const payload = { lang: 'en', meta: [], link: [] }

    vi.mocked(drupalApiRequest).mockResolvedValue(payload)
    const event = {} as Parameters<typeof fetchGlobalSeo>[0]

    await expect(fetchGlobalSeo(event)).resolves.toEqual(payload)
    expect(drupalApiRequest).toHaveBeenCalledWith(event, '/api/seo/global', {
      method: 'GET',
    })
  })

  it('preserves the stable optional-provider fallback', async () => {
    vi.mocked(drupalApiRequest).mockRejectedValue(new Error('Unavailable'))
    const event = {} as Parameters<typeof fetchGlobalSeo>[0]

    await expect(fetchGlobalSeo(event)).resolves.toEqual({
      meta: [],
      link: [],
    })
  })
})
