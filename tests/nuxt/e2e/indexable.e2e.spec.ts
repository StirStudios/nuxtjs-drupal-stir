import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { fetch, setup } from '@nuxt/test-utils/e2e'

const authUiConfigFixture = JSON.parse(readFileSync(fileURLToPath(new URL(
  '../../../contracts/stir-tools/v1/fixtures/auth-ui-config.json',
  import.meta.url,
)), 'utf8'))

// Minimal Drupal responses so shell pages such as /auth/login render HTML.
const drupalFixtureServer = createServer((request, response) => {
  const path = new URL(request.url || '/', 'http://127.0.0.1').pathname
  const payload = path === '/api/app-context'
    ? { blocks: {}, footer_menu: [], site_info: { name: 'Fixture site', mail: '', slogan: '' } }
    : path === '/api/auth/config'
      ? authUiConfigFixture
      : path === '/api/seo/global'
        ? { lang: 'en', meta: [], link: [] }
        : path.includes('/api/menu_items/') || path === '/api/sitemap' ? [] : {}

  response.writeHead(200, { 'content-type': 'application/json' })
  response.end(JSON.stringify(payload))
})

await new Promise<void>((resolve, reject) => {
  drupalFixtureServer.once('error', reject)
  drupalFixtureServer.listen(0, '127.0.0.1', resolve)
})

const address = drupalFixtureServer.address()

if (!address || typeof address === 'string') {
  throw new Error('Unable to start the Drupal fixture server.')
}

// Indexability is resolved at build time from these variables.
process.env.DRUPAL_URL = `http://127.0.0.1:${address.port}`
process.env.NUXT_ENV = 'production'
process.env.NUXT_URL = 'https://www.example.com'
Reflect.deleteProperty(process.env, 'NUXT_INDEXABLE')

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    drupalFixtureServer.close(error => error ? reject(error) : resolve())
  })
})

describe('Indexable production website', async () => {
  await setup({
    rootDir: fileURLToPath(
      new URL('../../fixtures/full-consumer', import.meta.url),
    ),
    browser: false,
    env: {
      DRUPAL_URL: `http://127.0.0.1:${address.port}`,
      NUXT_URL: 'https://www.example.com',
    },
    nuxtConfig: {
      sourcemap: { client: false, server: false },
    },
  })

  // Cache-Control is not asserted: the module sends no-store in test builds.
  it('keeps the published robots.txt with the sitemap reference', async () => {
    const response = await fetch('/robots.txt')

    expect(response.status).toBe(200)
    expect(await response.text()).toBe([
      '# START nuxt-robots (indexable)',
      'User-agent: *',
      'Disallow: ',
      '',
      'Sitemap: https://www.example.com/sitemap.xml',
      '# END nuxt-robots',
    ].join('\n'))
  })

  it('keeps private account and auth routes noindex in the header and meta', async () => {
    for (const path of ['/auth/login', '/account/profile', '/login']) {
      const response = await fetch(path, { redirect: 'manual' })

      expect(response.headers.get('x-robots-tag'), path).toBe('noindex, nofollow')
    }

    const html = await (await fetch('/auth/login')).text()

    expect(
      html.match(/<meta name="robots"[^>]*>/g),
      html.slice(0, 300),
    ).toEqual([
      '<meta name="robots" content="noindex, nofollow">',
    ])
  })

  it('keeps indexable robots headers on pages', async () => {
    const response = await fetch('/')

    expect(response.headers.get('x-robots-tag')).toBe(
      'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    )
  })
})
