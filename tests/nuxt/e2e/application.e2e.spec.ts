import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { fetch, setup } from '@nuxt/test-utils/e2e'

// Application mode: individual capability layers without SEO and client-side
// rendering, built for production with no NUXT_INDEXABLE override.
process.env.DRUPAL_URL = 'http://127.0.0.1:9'
process.env.NUXT_ENV = 'production'
process.env.NUXT_URL = 'https://app.example.com'
process.env.STIR_PRESENTATION_MANIFEST_FIXTURE = '1'
Reflect.deleteProperty(process.env, 'NUXT_INDEXABLE')

describe('Production application without the SEO capability', async () => {
  await setup({
    rootDir: fileURLToPath(
      new URL('../../fixtures/application-consumer', import.meta.url),
    ),
    browser: false,
    nuxtConfig: {
      sourcemap: { client: false, server: false },
    },
  })

  it('marks client-rendered pages noindex in the header and document', async () => {
    const response = await fetch('/')
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(html).toContain('<meta name="robots" content="noindex, nofollow">')
  })

  it('serves a robots.txt that disallows every crawler', async () => {
    const response = await fetch('/robots.txt')
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/plain')
    expect(body).toContain('(indexing disabled)')
    expect(body).toMatch(/User-agent: \*\nDisallow: \/\n/)
    expect(body).not.toContain('Sitemap:')
  })

  it('returns a real 404 for sitemap paths instead of the application shell', async () => {
    for (const path of ['/sitemap.xml', '/sitemap_index.xml', '/__sitemap__/style.xsl']) {
      const response = await fetch(path)
      const body = await response.text()

      expect(response.status, path).toBe(404)
      expect(response.headers.get('content-type'), path).toContain('text/plain')
      expect(body, path).not.toContain('<html')
    }
  })
})
