import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { $fetch, createPage, setup, url } from '@nuxt/test-utils/e2e'
import { layerAuthCreateProtectedAccessToken } from '../../../layers/auth/server/utils/protectedAccessToken'

const pageFixture = {
  title: 'Fixture page',
  metatags: { meta: [], link: [], jsonld: null },
  content: {
    element: 'node--default',
    props: { title: 'Fixture page' },
    slots: {
      body: [{
        element: 'drupal-markup',
        props: { content: '<p>Direct node body</p>' },
        slots: {},
      }],
      website: [{
        element: 'field-link',
        props: {
          url: '/contact',
          label: 'Contact this page',
          external: false,
        },
        slots: {},
      }],
      published: [{
        element: 'date-time-value',
        props: { datetime: '2026-07-15', dateOnly: true },
        slots: {},
      }],
      level: [{
        element: 'entity-reference',
        props: {
          id: '7',
          entityType: 'taxonomy_term',
          label: 'Intermediate',
        },
        slots: {},
      }],
      location: [{
        element: 'address-value',
        props: {
          locality: 'Los Angeles',
          countryCode: 'US',
          lines: ['Los Angeles, CA', 'US'],
        },
        slots: {},
      }],
    },
  },
}

const authUiConfigFixture = JSON.parse(readFileSync(resolve(
  __dirname,
  '../../../contracts/stir-tools/v1/fixtures/auth-ui-config.json',
), 'utf8'))

const drupalFixtureServer = createServer((request, response) => {
  const path = new URL(request.url || '/', 'http://127.0.0.1').pathname
  const payload = path === '/api/app-context'
    ? {
        blocks: {},
        footer_menu: [],
        site_info: { name: 'Fixture site', mail: '', slogan: '' },
      }
    : path === '/api/auth/config'
      ? authUiConfigFixture
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
  PROTECTED_PASSWORD: process.env.PROTECTED_PASSWORD,
}

process.env.DRUPAL_URL = drupalFixtureUrl
process.env.NUXT_URL = 'http://127.0.0.1'
process.env.NUXT_INDEXABLE = 'false'
process.env.PROTECTED_PASSWORD = 'fixture-protected-password'

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
      PROTECTED_PASSWORD: 'fixture-protected-password',
    },
    nuxtConfig: {
      appConfig: {
        protectedRoutes: {
          requireLoginPaths: ['/protected-fixture'],
          loginPath: '/auth/protected',
          allowAuthenticatedUserBypass: false,
          fallbackRedirectPath: '/',
        } as never,
      },
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
    const response = await $fetch('/api/health')

    expect(response).toEqual({
      ok: true,
      service: 'nuxtjs-drupal-stir',
      presentation: {
        manifestRevision: '',
        sourceRevision: '',
        mode: 'compatibility',
        schemaVersion: 0,
        siteUuid: '',
        theme: '',
      },
    })
  })

  it('keeps public configuration endpoints available', async () => {
    const [authConfig, seo] = await Promise.all([
      $fetch<Record<string, unknown>>('/api/auth/config'),
      $fetch<{ lang?: string, meta: unknown[], link: unknown[] }>('/api/seo/global'),
    ])

    expect(authConfig).toBeTypeOf('object')
    expect(authConfig.version).toBe(2)
    expect(seo).toEqual({ lang: 'en', meta: [], link: [] })
  })

  it('renders the deterministic homepage twice without SSR drift', async () => {
    const firstHtml = await $fetch<string>('/')
    const secondHtml = await $fetch<string>('/')

    expect(firstHtml).toContain('Fixture page')
    expect(firstHtml).toContain('Direct node body')
    expect(firstHtml).toContain('Contact this page')
    expect(firstHtml).toContain('Intermediate')
    expect(firstHtml).toContain('Los Angeles, CA')
    expect(secondHtml).toBe(firstHtml)
  })

  it('prevents shared caching of authenticated protected HTML', async () => {
    const token = await layerAuthCreateProtectedAccessToken(
      'fixture-protected-password',
      60,
    )
    const protectedResponse = await fetch(url('/protected-fixture'), {
      headers: {
        cookie: `protected_access=${token}`,
      },
    })
    const publicResponse = await fetch(url('/'))
    const protectedHtml = await protectedResponse.text()

    expect(protectedResponse.status).toBe(200)
    expect(protectedHtml).toContain('Fixture page')
    expect(protectedResponse.headers.get('cache-control')).toBe(
      'private, no-store, max-age=0',
    )
    expect(publicResponse.headers.get('cache-control')).not.toBe(
      'private, no-store, max-age=0',
    )
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
    expect(bodyText).toContain('Direct node body')
    expect(bodyText).toContain('Contact this page')
    expect(bodyText).toContain('Intermediate')
    expect(bodyText).toContain('Los Angeles, CA')
    expect(clientErrors).toEqual([])

    await page.close()
  })
})
