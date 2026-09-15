import { beforeAll, describe, expect, it, vi } from 'vitest'
import sitemapUnavailable from '../../layers/foundation/server/handlers/sitemap-unavailable'

type RenderHtml = (
  html: { head: string[] },
  context: { event: { context: Record<string, unknown> } },
) => void

let renderHtml: RenderHtml

beforeAll(async () => {
  vi.stubGlobal('defineNitroPlugin', (plugin: unknown) => plugin)
  const { default: plugin } = await import(
    '../../layers/foundation/server/plugins/robots-client-rendered-meta'
  )

  ;(plugin as (nitroApp: unknown) => void)({
    hooks: {
      hook: (name: string, handler: RenderHtml) => {
        if (name === 'render:html') renderHtml = handler
      },
    },
  })
})

describe('sitemap routes without the SEO capability', () => {
  it('returns a plain 404 instead of the application shell', async () => {
    const headers = new Map<string, string>()
    const res = {
      statusCode: 200,
      setHeader: (name: string, value: string) => headers.set(name.toLowerCase(), value),
      getHeader: (name: string) => headers.get(name.toLowerCase()),
    }

    const body = await sitemapUnavailable({
      node: { req: { headers: {}, url: '/sitemap.xml' }, res },
    } as never)

    expect(res.statusCode).toBe(404)
    expect(headers.get('content-type')).toBe('text/plain; charset=utf-8')
    expect(body).toBe('Not Found')
  })
})

describe('robots meta for client-rendered documents', () => {
  it('adds the resolved robots rule when no robots meta was rendered', () => {
    const html = { head: ['<meta charset="utf-8">'] }

    renderHtml(html, { event: { context: { robots: { rule: 'noindex, nofollow' } } } })

    expect(html.head).toContain('<meta name="robots" content="noindex, nofollow">')
  })

  it('keeps server-rendered robots meta as the only directive', () => {
    const rendered = '<meta name="robots" content="index, follow">'
    const html = { head: [rendered] }

    renderHtml(html, { event: { context: { robots: { rule: 'noindex, nofollow' } } } })

    expect(html.head).toEqual([rendered])
  })

  it('adds nothing when Robots resolved no rule for the request', () => {
    const html = { head: [] as string[] }

    renderHtml(html, { event: { context: {} } })

    expect(html.head).toEqual([])
  })
})
