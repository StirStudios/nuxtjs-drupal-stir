import { createServer } from 'node:http'
import { afterAll, describe, expect, it } from 'vitest'
import { $fetch, createPage, setup, url } from '@nuxt/test-utils/e2e'

const pageFixture = {
  title: 'Fixture page',
  metatags: { meta: [], link: [], jsonld: null },
  content: {
    element: 'node--default',
    props: { title: 'Fixture page' },
    slots: {
      section: [{
        element: 'paragraph-text',
        props: { text: '<p>Fixture text</p>' },
        slots: {},
      }],
    },
  },
}

const drupalFixtureServer = createServer((request, response) => {
  const path = new URL(request.url || '/', 'http://127.0.0.1').pathname
  const payload = path === '/api/app-context'
    ? {
        blocks: {},
        footer_menu: [],
        site_info: { name: 'Fixture site', mail: '', slogan: '' },
      }
    : path === '/api/seo/global'
      ? { lang: 'en', meta: [], link: [] }
      : path.includes('/api/menu_items/')
        ? []
        : pageFixture

  response.writeHead(200, { 'content-type': 'application/json' })
  response.end(JSON.stringify(payload))
})

await new Promise<void>((resolve, reject) => {
  drupalFixtureServer.once('error', reject)
  drupalFixtureServer.listen(0, '127.0.0.1', resolve)
})

const address = drupalFixtureServer.address()

if (!address || typeof address === 'string') {
  throw new Error('Unable to start the deterministic Drupal fixture server.')
}

const drupalFixtureUrl = `http://127.0.0.1:${address.port}`
const browserEnabled = process.env.CI === 'true'
  || process.env.STIR_E2E_BROWSER === 'true'
const originalEnvironment = {
  DRUPAL_URL: process.env.DRUPAL_URL,
  NUXT_URL: process.env.NUXT_URL,
  NUXT_INDEXABLE: process.env.NUXT_INDEXABLE,
}

process.env.DRUPAL_URL = drupalFixtureUrl
process.env.NUXT_URL = 'http://127.0.0.1'
process.env.NUXT_INDEXABLE = 'false'

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    drupalFixtureServer.close(error => error ? reject(error) : resolve())
  })

  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) Reflect.deleteProperty(process.env, key)
    else process.env[key] = value
  }
})

describe('Nuxt E2E smoke', async () => {
  await setup({
    browser: browserEnabled,
    env: {
      DRUPAL_URL: drupalFixtureUrl,
      NUXT_URL: 'http://127.0.0.1',
      NUXT_INDEXABLE: 'false',
    },
    nuxtConfig: {
      sourcemap: {
        client: false,
        server: false,
      },
      vite: {
        build: {
          sourcemap: false,
        },
      },
    },
  })

  it('returns health endpoint payload', async () => {
    const response = await $fetch<{ ok: boolean, service: string }>('/api/health')

    expect(response).toEqual({
      ok: true,
      service: 'nuxtjs-drupal-stir',
    })
  })

  it('keeps public configuration endpoints available', async () => {
    const [authConfig, seo] = await Promise.all([
      $fetch<Record<string, unknown>>('/api/auth/config'),
      $fetch<{ lang?: string, meta: unknown[], link: unknown[] }>('/api/seo/global'),
    ])

    expect(authConfig).toBeTypeOf('object')
    if ('version' in authConfig) expect(authConfig.version).toBeTypeOf('number')
    expect(seo).toEqual({ lang: 'en', meta: [], link: [] })
  })

  it('renders the deterministic homepage twice without SSR drift', async () => {
    const firstHtml = await $fetch<string>('/')
    const secondHtml = await $fetch<string>('/')

    expect(firstHtml).toContain('Fixture page')
    expect(firstHtml).toContain('Fixture text')
    expect(secondHtml).toBe(firstHtml)
  })

  it.runIf(browserEnabled)('hydrates the deterministic homepage without client errors', async () => {
    const page = await createPage()
    const clientErrors: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'error') clientErrors.push(message.text())
    })
    page.on('pageerror', error => clientErrors.push(error.message))

    const response = await page.goto(url('/'), { waitUntil: 'hydration' })
    const bodyText = await page.locator('body').textContent()

    expect(response?.status()).toBe(200)
    expect(bodyText).toContain('Fixture page')
    expect(bodyText).toContain('Fixture text')
    expect(clientErrors).toEqual([])

    await page.close()
  })
})
