import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import listingHandler from '../../layers/core/server/api/listings/[listing].get'
import {
  isPrivateStirListingResponse,
  parseStirListingId,
  parseStirListingResponse,
} from '../../layers/core/server/utils/listingApi'

const producerFixture = () => JSON.parse(readFileSync(resolve(
  __dirname,
  '../../contracts/stir-tools/v1/fixtures/listing-response.json',
), 'utf8'))

describe('Stir listing API contract', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('parses the synchronized producer fixture', () => {
    const fixture = producerFixture()

    expect(parseStirListingResponse(fixture)).toEqual(fixture)
  })

  it('rejects undocumented response properties', () => {
    const fixture = producerFixture()

    fixture.performance = { totalTimeMs: 10 }

    expect(() => parseStirListingResponse(fixture)).toThrowError()
  })

  it('rejects invalid paging and privacy metadata', () => {
    const fixture = producerFixture()

    fixture.pager.pageSize = 101
    fixture.meta.personalized = 'false'

    expect(() => parseStirListingResponse(fixture)).toThrowError()
  })

  it('accepts only bounded Drupal machine names', () => {
    expect(parseStirListingId('editorial_articles')).toBe('editorial_articles')
    expect(() => parseStirListingId('../articles')).toThrowError()
    expect(() => parseStirListingId('Articles')).toThrowError()
  })

  it.each([
    [false, false, false, false],
    [true, false, false, true],
    [false, true, false, true],
    [false, false, true, true],
  ])(
    'derives response privacy from request, session, and producer signals',
    (hasRequestCookie, setsSessionCookie, personalized, expected) => {
      expect(isPrivateStirListingResponse({
        hasRequestCookie,
        setsSessionCookie,
        personalized,
      })).toBe(expected)
    },
  )

  it('forwards validated public cache metadata through the real route', async () => {
    const fixture = producerFixture()
    const { event, headers } = routeEvent('articles')
    const raw = vi.fn().mockResolvedValue({
      _data: fixture,
      status: 200,
      headers: new Headers({
        'cache-control': 'public, max-age=300',
        etag: '"listing-v1"',
      }),
    })

    stubListingRuntime(raw)

    await expect(listingHandler(event)).resolves.toEqual(fixture)
    expect(headers.get('cache-control')).toBe('public, max-age=300')
    expect(headers.get('etag')).toBe('"listing-v1"')
    expect(headers.get('x-stir-listing-contract')).toBe('1')
  })

  it('marks upstream and contract failures private before returning an error', async () => {
    const { event, headers } = routeEvent('articles')
    const raw = vi.fn().mockRejectedValue(Object.assign(
      new Error('Drupal unavailable'),
      { statusCode: 503 },
    ))

    stubListingRuntime(raw)

    await expect(listingHandler(event)).rejects.toMatchObject({
      statusCode: 502,
    })
    expect(headers.get('cache-control')).toBe('private, no-store, max-age=0')
  })
})

function routeEvent(listing: string) {
  const headers = new Map<string, string | string[]>()

  return {
    event: {
      context: { params: { listing } },
      method: 'GET',
      node: {
        req: { headers: {}, method: 'GET', url: `/api/listings/${listing}` },
        res: {
          getHeader: (name: string) => headers.get(name.toLowerCase()),
          setHeader: (name: string, value: string | string[]) => {
            headers.set(name.toLowerCase(), value)
          },
        },
      },
    } as never,
    headers,
  }
}

function stubListingRuntime(raw: ReturnType<typeof vi.fn>): void {
  vi.stubGlobal('$fetch', { raw })
  vi.stubGlobal('useRuntimeConfig', () => ({
    api: 'https://cms.example.test',
    apiKey: 'server-key',
    public: { api: 'https://cms.example.test', drupalCe: {} },
  }))
}
