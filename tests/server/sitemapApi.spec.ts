import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getStirDrupalApiConfig,
  stirDrupalApiRequest,
} from '../../layers/foundation/server/utils/stirDrupalApi'
import {
  fetchSitemap,
  parseSitemapResponse,
} from '../../layers/seo/server/utils/sitemapApi'
import { parseSitemapExtensionEntries } from '../../layers/seo/server/utils/sitemapExtensions'

vi.mock('../../layers/foundation/server/utils/stirDrupalApi', () => ({
  getStirDrupalApiConfig: vi.fn(),
  stirDrupalApiRequest: vi.fn(),
}))

type Handler = (context: { event: unknown, entries: unknown[] }) => unknown

const producerFixture = () => JSON.parse(readFileSync(resolve(
  __dirname,
  '../../contracts/stir-tools/v1/fixtures/sitemap.json',
), 'utf8'))

const baseEntry = (loc: string) => ({
  loc,
  lastmod: null,
  changefreq: null,
  priority: null,
})

const image = { loc: 'https://cdn.example.com/class.jpg', title: 'Class' }
const video = {
  title: 'Class preview',
  description: 'Preview',
  thumbnail_loc: 'https://cdn.example.com/thumb.jpg',
  content_loc: 'https://cdn.example.com/preview.mp4',
  duration: 90,
  family_friendly: true,
}

const registerHandlers = (handlers: Handler[]) => {
  vi.stubGlobal('useNitroApp', () => ({
    hooks: {
      callHookWith: (
        caller: (hooks: Handler[], args: unknown[]) => unknown,
        _name: string,
        ...args: unknown[]
      ) => caller(handlers, args),
    },
  }))
}

describe('sitemapApi', () => {
  const event = {} as Parameters<typeof fetchSitemap>[0]

  beforeEach(() => {
    vi.mocked(stirDrupalApiRequest).mockReset()
    vi.mocked(getStirDrupalApiConfig).mockReturnValue({
      baseUrl: 'https://cms.example.com',
      apiKey: '',
      requestTimeoutMs: 50,
    })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    registerHandlers([])
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('parses the synchronized producer fixture through the production boundary', () => {
    const fixture = producerFixture()

    expect(parseSitemapResponse(fixture)).toEqual(fixture)
  })

  it('rejects malformed and undocumented entry data', () => {
    expect(() => parseSitemapResponse([{
      ...baseEntry('/example'),
      legacy: true,
    }])).toThrow('Invalid Drupal sitemap contract at 0')

    expect(() => parseSitemapResponse([{
      ...baseEntry('/example'),
      images: [image],
    }])).toThrow('Invalid Drupal sitemap contract at 0')

    expect(() => parseSitemapResponse([baseEntry('')]))
      .toThrow('Invalid Drupal sitemap contract at 0.loc')
  })

  it('returns the unchanged base sitemap when no extension is registered', async () => {
    const fixture = producerFixture()

    vi.mocked(stirDrupalApiRequest).mockResolvedValue(fixture)

    await expect(fetchSitemap(event)).resolves.toEqual(fixture)
    expect(stirDrupalApiRequest).toHaveBeenCalledWith(event, '/api/sitemap', {
      method: 'GET',
    })
  })

  it('merges extension images and videos into matching Drupal URLs', async () => {
    vi.mocked(stirDrupalApiRequest).mockResolvedValue([
      baseEntry('/classes/salsa'),
      baseEntry('/about'),
    ])
    const handler = vi.fn(async (context: { entries: unknown[] }) => {
      context.entries.push(
        { loc: 'https://www.example.com/classes/salsa/', images: [image] },
        { loc: 'https://www.example.com/classes/salsa', videos: [video] },
        { loc: 'https://www.example.com/not-in-drupal', images: [image] },
      )
    })

    registerHandlers([handler])

    await expect(fetchSitemap(event)).resolves.toEqual([
      { ...baseEntry('/classes/salsa'), images: [image], videos: [video] },
      baseEntry('/about'),
    ])
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ event }))
  })

  it('drops invalid extension entries with a warning', () => {
    const entries = parseSitemapExtensionEntries([
      { loc: '/relative', images: [image] },
      { loc: 'https://www.example.com/a', images: [{ loc: 'ftp://x/y.jpg' }] },
      { loc: 'https://www.example.com/b', videos: [{ ...video, content_loc: undefined }] },
      { loc: 'https://www.example.com/c', extra: true },
      { loc: 'https://www.example.com/d', images: [image] },
    ], 'test')

    expect(entries).toEqual([{ loc: 'https://www.example.com/d', images: [image] }])
    expect(console.warn).toHaveBeenCalledTimes(4)
    expect(parseSitemapExtensionEntries({ loc: 'x' }, 'test')).toEqual([])
  })

  it('falls back to the base sitemap when an extension throws or times out', async () => {
    const fixture = producerFixture()

    vi.mocked(stirDrupalApiRequest).mockResolvedValue(fixture)
    registerHandlers([
      () => {
        throw new Error('Drupal extension unavailable')
      },
      () => Promise.reject(new Error('Rejected')),
      () => new Promise(() => {}),
    ])

    await expect(fetchSitemap(event)).resolves.toEqual(fixture)
    expect(console.warn).toHaveBeenCalledTimes(3)
  })

  it('keeps a working extension when another one fails', async () => {
    vi.mocked(stirDrupalApiRequest).mockResolvedValue([baseEntry('/')])
    registerHandlers([
      () => Promise.reject(new Error('Unavailable')),
      (context) => {
        context.entries.push({ loc: 'https://www.example.com/', images: [image] })
      },
    ])

    await expect(fetchSitemap(event)).resolves.toEqual([
      { ...baseEntry('/'), images: [image] },
    ])
    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it('still fails when the base Drupal payload is invalid', async () => {
    vi.mocked(stirDrupalApiRequest).mockResolvedValue([{ loc: '/x' }])
    registerHandlers([(context) => {
      context.entries.push({ loc: 'https://www.example.com/x', images: [image] })
    }])

    await expect(fetchSitemap(event)).rejects.toThrow('Invalid Drupal sitemap contract')
  })
})
