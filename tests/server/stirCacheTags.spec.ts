import { beforeAll, describe, expect, it, vi } from 'vitest'
import {
  applyStirCacheTagsHeader,
  stirSiteCacheTag,
  applyStirSharedMaxAge,
  formatStirCacheTags,
  parseStirCacheUntil,
  parseStirSharedMaxAge,
  parseStirCacheTags,
  recordStirCacheTags,
  STIR_OVERSIZE_CACHE_TAG,
} from '../../layers/foundation/server/utils/stirCacheTags'

type Hook = (event: never) => void

const createEvent = (headers: Record<string, string | string[]> = {}) => {
  const responseHeaders = new Map<string, string | string[]>(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]),
  )

  return {
    event: {
      context: {},
      node: {
        res: {
          getHeader: (name: string) => responseHeaders.get(name.toLowerCase()),
          removeHeader: (name: string) => responseHeaders.delete(name.toLowerCase()),
          setHeader: (name: string, value: string | string[]) => {
            responseHeaders.set(name.toLowerCase(), value)
          },
        },
      },
    } as never,
    responseHeaders,
  }
}

const tagHeaders = (value: string) => new Headers({ 'x-cache-tags': value })

let hooks: Record<string, Hook> = {}

beforeAll(async () => {
  vi.stubGlobal('defineNitroPlugin', (plugin: unknown) => plugin)
  const { default: plugin } = await import('../../layers/foundation/server/plugins/cache-tags')

  ;(plugin as (nitroApp: unknown) => void)({
    hooks: {
      hook: (name: string, handler: Hook) => {
        hooks = { ...hooks, [name]: handler }
      },
    },
  })
})

describe('Drupal cache tags on responses', () => {
  it('parses space- and comma-separated values and drops invalid tags', () => {
    expect(parseStirCacheTags(['node:5 Node_List', 'config:system.menu.main, bad"tag'])).toEqual([
      'node:5',
      'node_list',
      'config:system.menu.main',
    ])
    expect(parseStirCacheTags(undefined)).toEqual([])
  })

  it('formats unique sorted tags', () => {
    expect(formatStirCacheTags(['node:5', 'node_list', 'node:5'])).toBe('node:5 node_list')
  })

  it('drops per-entity tags for the oversize tag when over budget', () => {
    const tags = ['node_list', 'config:system.menu.main', ...Array.from({ length: 50 }, (_, i) => `node:${i}`)]

    expect(formatStirCacheTags(tags, 60)).toBe(`${STIR_OVERSIZE_CACHE_TAG} config:system.menu.main node_list`)
  })

  it('falls back to the oversize tag alone', () => {
    expect(formatStirCacheTags(['config:a', 'config:b', 'config:c'], 10)).toBe(STIR_OVERSIZE_CACHE_TAG)
  })

  it('merges recorded tags with tags already on the response into one header', () => {
    const { event, responseHeaders } = createEvent({ 'x-cache-tags': ['node:9 node_list', 'node:9'] })

    recordStirCacheTags(event, tagHeaders('config:system.menu.main'))
    applyStirCacheTagsHeader(event)

    expect(responseHeaders.get('x-cache-tags')).toBe('config:system.menu.main node:9 node_list')
  })

  it('adds the site tag to a response with Drupal tags', () => {
    const { event, responseHeaders } = createEvent({ 'x-cache-tags': 'node:9' })

    applyStirCacheTagsHeader(event, stirSiteCacheTag('https://lgrey.drupal.sgla.ddev.site/'))

    expect(responseHeaders.get('x-cache-tags')).toBe('node:9 stir:site:lgrey.drupal.sgla.ddev.site')
  })

  it('adds no site tag to a response without Drupal tags', () => {
    const { event, responseHeaders } = createEvent()

    applyStirCacheTagsHeader(event, 'stir:site:a.example.com')

    expect(responseHeaders.has('x-cache-tags')).toBe(false)
  })

  it('keeps the site tag when only the oversize tag fits', () => {
    expect(formatStirCacheTags(['config:a', 'config:b', 'stir:site:a.example.com'], 10))
      .toBe(`${STIR_OVERSIZE_CACHE_TAG} stir:site:a.example.com`)
  })

  it('has no site tag without a Drupal URL', () => {
    expect(stirSiteCacheTag('')).toBeUndefined()
    expect(stirSiteCacheTag('https://CMS.Example.com:8443/api')).toBe('stir:site:cms.example.com:8443')
  })

  it('sends no tags on a private response', () => {
    const { event, responseHeaders } = createEvent({
      'cache-control': 'private, no-store, max-age=0',
      'x-cache-tags': 'node:9',
    })

    applyStirCacheTagsHeader(event)

    expect(responseHeaders.has('x-cache-tags')).toBe(false)
  })

  it('records the tags of internal requests made through the event fetch', async () => {
    const { event, responseHeaders } = createEvent()
    const callerHook = vi.fn()
    const original = vi.fn(async (_request: unknown, options: { onResponse: Array<(context: unknown) => void> }) => {
      for (const hook of options.onResponse) hook({ response: { headers: tagHeaders('config:system.menu.main') } })
      return {}
    })

    ;(event as { $fetch?: unknown }).$fetch = original

    hooks.request!(event)
    await (event as unknown as { $fetch: (r: string, o: unknown) => Promise<unknown> }).$fetch('/api/menu/main', { onResponse: callerHook })
    hooks.beforeResponse!(event)

    expect(callerHook).toHaveBeenCalledOnce()
    expect(responseHeaders.get('x-cache-tags')).toBe('config:system.menu.main')
  })

  it('counts down to x-stir-cache-until', () => {
    const now = 1_760_000_000_000

    expect(parseStirCacheUntil(String(1_760_000_000 + 600), now)).toBe(600)
    expect(parseStirCacheUntil(String(1_760_000_000 - 5), now)).toBe(0)
    expect(parseStirCacheUntil('soon', now)).toBeUndefined()
    expect(parseStirCacheUntil(undefined, now)).toBeUndefined()
  })

  it('counts down to the page response\'s own x-stir-cache-until', () => {
    // The Drupal CE page fetch passes both headers through to the page.
    const until = Math.floor(Date.now() / 1000) + 300
    const { event, responseHeaders } = createEvent({
      'cache-control': 'max-age=60, public, s-maxage=85809',
      'x-stir-cache-until': String(until),
    })

    applyStirSharedMaxAge(event)

    const age = Number(/s-maxage=(\d+)/.exec(String(responseHeaders.get('cache-control')))?.[1])

    expect(age).toBeGreaterThanOrEqual(299)
    expect(age).toBeLessThanOrEqual(300)
  })

  it('takes the clock time over a repeated, overshooting s-maxage', () => {
    // A page-cache response from hours ago: s-maxage still counts from then.
    const until = Math.floor(Date.now() / 1000) + 600
    const { event, responseHeaders } = createEvent({ 'cache-control': 'max-age=60, public, s-maxage=86400' })

    recordStirCacheTags(event, new Headers({ 'cache-control': 'public, s-maxage=84928', 'x-stir-cache-until': String(until) }))
    applyStirSharedMaxAge(event)

    const age = Number(/s-maxage=(\d+)/.exec(String(responseHeaders.get('cache-control')))?.[1])

    expect(age).toBeGreaterThanOrEqual(599)
    expect(age).toBeLessThanOrEqual(600)
  })

  it('reads the smallest s-maxage from Cache-Control values', () => {
    expect(parseStirSharedMaxAge(['max-age=60, public, s-maxage=86400', 'public, s-maxage=3600'])).toBe(3600)
    expect(parseStirSharedMaxAge('max-age=3600, public')).toBeUndefined()
  })

  it('gives a public page the smallest lifetime of its Drupal responses', () => {
    const { event, responseHeaders } = createEvent({ 'cache-control': 'max-age=60, public, s-maxage=86400' })

    recordStirCacheTags(event, new Headers({ 'cache-control': 'max-age=60, public, s-maxage=900' }))
    recordStirCacheTags(event, new Headers({ 'cache-control': 'max-age=3600, public' }))
    applyStirSharedMaxAge(event)

    expect(responseHeaders.get('cache-control')).toBe('public, max-age=60, s-maxage=900')
  })

  it('keeps the browser lifetime under a short Varnish lifetime', () => {
    const { event, responseHeaders } = createEvent({ 'cache-control': 'public, max-age=30, s-maxage=30' })

    applyStirSharedMaxAge(event)

    expect(responseHeaders.get('cache-control')).toBe('public, max-age=30, s-maxage=30')
  })

  it('leaves private and lifetime-less responses alone', () => {
    const { event, responseHeaders } = createEvent({ 'cache-control': 'private, no-store, max-age=0' })

    recordStirCacheTags(event, new Headers({ 'cache-control': 'public, s-maxage=900' }))
    applyStirSharedMaxAge(event)
    expect(responseHeaders.get('cache-control')).toBe('private, no-store, max-age=0')

    const plain = createEvent({ 'cache-control': 'max-age=3600, public' })

    applyStirSharedMaxAge(plain.event)
    expect(plain.responseHeaders.get('cache-control')).toBe('max-age=3600, public')
  })
})
