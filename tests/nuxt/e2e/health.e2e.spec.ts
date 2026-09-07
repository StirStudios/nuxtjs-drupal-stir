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

const carouselFixture = {
  ...pageFixture,
  content: {
    ...pageFixture.content,
    slots: {
      body: [
        {
          element: 'drupal-markup',
          props: { content: '<div style="height:3000px" aria-hidden="true"></div>' },
          slots: {},
        },
        {
          element: 'drupal-view--default',
          props: { viewId: 'interaction', displayId: 'block', carousel: true },
          slots: {
            rows: [{
              element: 'paragraph-accordion',
              props: { id: 'nested-accordion' },
              slots: {
                items: [{
                  element: 'paragraph-text',
                  props: { id: 'answer', header: 'Open nested answer', text: '<p>Nested answer content</p>' },
                  slots: {},
                }],
              },
            }],
          },
        },
      ],
    },
  },
}

const pauseControlsFixture = {
  ...pageFixture,
  content: {
    ...pageFixture.content,
    slots: {
      body: [0, 1, 2].map(index => ({
        element: 'paragraph-carousel',
        props: { id: `pause-${index}`, presentation: 'carousel' },
        slots: {
          items: ['One', 'Two'].map(text => ({
            element: 'paragraph-text',
            props: { text: `<p>${text}</p>` },
            slots: {},
          })),
        },
      })),
    },
  },
}

const imageLoadingFixture = {
  ...pageFixture,
  content: {
    ...pageFixture.content,
    slots: {
      body: [{
        element: 'paragraph-carousel',
        props: { presentation: 'carousel' },
        slots: {
          items: [1, 2].map(index => ({
            element: 'media-image',
            props: { src: `/fixture-${index}.jpg`, alt: `Delivery fixture ${index}`, width: 1200, height: 667, loading: 'eager', fetchpriority: 'high', noWrapper: true },
            slots: {},
          })),
        },
      }],
    },
  },
}

const authUiConfigFixture = JSON.parse(readFileSync(resolve(
  __dirname,
  '../../../contracts/stir-tools/v1/fixtures/auth-ui-config.json',
), 'utf8'))
const presentationManifestFixture = JSON.parse(readFileSync(resolve(
  __dirname,
  '../../../contracts/stir-tools/v1/fixtures/presentation-usage-manifest.json',
), 'utf8'))
let presentationManifestApiKey: string | undefined

const drupalFixtureServer = createServer((request, response) => {
  const path = new URL(request.url || '/', 'http://127.0.0.1').pathname

  if (path === '/ce-api/stir-layout-builder/presentation-manifest') {
    const apiKey = request.headers['x-api-key']

    presentationManifestApiKey = Array.isArray(apiKey) ? apiKey[0] : apiKey
  }
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
      : path === '/ce-api/stir-layout-builder/presentation-manifest'
        ? presentationManifestFixture
      : path.includes('/api/menu_items/')
        ? []
        : path.endsWith('/image-loading-fixture') ? imageLoadingFixture
        : path.endsWith('/pause-controls-fixture') ? pauseControlsFixture
          : path.endsWith('/carousel-interaction-fixture') ? carouselFixture : pageFixture

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
const normalizeNuxtPayload = (html: string) => html.replace(
  /<script type="application\/json" data-nuxt-data="nuxt-app"[^>]*>.*?<\/script>/su,
  '<script type="application/json" data-nuxt-data="nuxt-app"></script>',
)
const originalEnvironment = {
  DRUPAL_API_KEY: process.env.DRUPAL_API_KEY,
  DRUPAL_URL: process.env.DRUPAL_URL,
  NUXT_URL: process.env.NUXT_URL,
  NUXT_INDEXABLE: process.env.NUXT_INDEXABLE,
  PROTECTED_PASSWORD: process.env.PROTECTED_PASSWORD,
  STIR_PRESENTATION_MANIFEST: process.env.STIR_PRESENTATION_MANIFEST,
}

process.env.DRUPAL_API_KEY = 'fixture-api-key'
process.env.DRUPAL_URL = drupalFixtureUrl
process.env.NUXT_URL = 'http://127.0.0.1'
process.env.NUXT_INDEXABLE = 'false'
process.env.PROTECTED_PASSWORD = 'fixture-protected-password'
process.env.STIR_PRESENTATION_MANIFEST = `${drupalFixtureUrl}/ce-api/stir-layout-builder/presentation-manifest`

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
      DRUPAL_API_KEY: 'fixture-api-key',
      DRUPAL_URL: drupalFixtureUrl,
      NUXT_URL: 'http://127.0.0.1',
      NUXT_INDEXABLE: 'false',
      PROTECTED_PASSWORD: 'fixture-protected-password',
      STIR_PRESENTATION_MANIFEST: `${drupalFixtureUrl}/ce-api/stir-layout-builder/presentation-manifest`,
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
        manifestRevision: presentationManifestFixture.revision,
        sourceRevision: expect.stringMatching(/^[a-f0-9]{64}$/u),
        schemaVersion: 2,
        siteUuid: 'fixture-site',
        theme: 'stir',
      },
    })
    expect(presentationManifestApiKey).toBe('fixture-api-key')
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
    // Concurrent SSR data can be inserted into Nuxt's payload in a different
    // key order while producing the same rendered document.
    expect(normalizeNuxtPayload(secondHtml)).toBe(normalizeNuxtPayload(firstHtml))
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

  it('renders reused hero images with viewport loading before hydration', async () => {
    const html = await $fetch<string>('/image-loading-fixture')
    const images = [...html.matchAll(/<img\b[^>]*>/g)]
      .map(match => match[0]).filter(image => image.includes('Delivery fixture'))

    expect(images).toHaveLength(2)
    for (const image of images) {
      expect(image).toContain('loading="lazy"')
      expect(image).toContain('fetchpriority="auto"')
      expect(image).toContain('src=')
      expect(image).not.toContain('data-src=')
    }
  })

  it('leaves inactive SSR pause controls unbound until their carousel mounts', async () => {
    const html = await $fetch<string>('/pause-controls-fixture')
    const buttons = [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)]
      .map(match => match[0]).filter(button => button.includes('Pause automatic scrolling'))

    expect(buttons).toHaveLength(3)
    for (const button of buttons) {
      expect(button).toContain('disabled')
      expect(button).not.toContain('aria-controls=')
    }
  })

  it.runIf(browserEnabled)('binds mounted pause controls to existing unique carousel targets', async () => {
    const page = await createPage()

    await page.goto(url('/pause-controls-fixture'), { waitUntil: 'networkidle' })
    const controls = page.getByRole('button', { name: 'Pause automatic scrolling' })

    await controls.first().waitFor()
    const targets = await controls.evaluateAll(buttons => buttons.map(button => {
      const id = button.getAttribute('aria-controls')

      return { enabled: !button.hasAttribute('disabled'), matches: id ? document.querySelectorAll(`[id="${id}"]`).length : 0 }
    }))

    expect(targets).toEqual(Array.from({ length: 3 }, () => ({ enabled: true, matches: 1 })))
    await controls.first().focus()
    await page.keyboard.press('Enter')
    await page.getByRole('button', { name: 'Start automatic scrolling' }).waitFor()
    await page.close()
  })

  it.runIf(browserEnabled)('preserves the first keyboard activation in an offscreen View carousel', async () => {
    const page = await createPage()
    const clientErrors: string[] = []

    page.on('pageerror', error => clientErrors.push(error.message))
    await page.route('**/_nuxt/**', async (route) => {
      if (route.request().url().endsWith('.js')) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      await route.continue()
    })
    await page.goto(url('/carousel-interaction-fixture'), { waitUntil: 'networkidle' })
    const button = page.getByRole('button', { name: 'Open nested answer' })

    await button.focus()
    await page.keyboard.press('Enter')

    await page.waitForFunction(() => document.querySelector('button[aria-expanded="true"]') !== null)
    expect(await button.getAttribute('aria-expanded')).toBe('true')
    expect(clientErrors).toEqual([])
    await page.close()
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

  it.runIf(browserEnabled)('hydrates without client errors when reduced motion is requested', async () => {
    const page = await createPage()
    const clientErrors: string[] = []

    await page.emulateMedia({ reducedMotion: 'reduce' })
    page.on('console', (message) => {
      if (message.type() === 'error') clientErrors.push(message.text())
    })
    page.on('pageerror', error => clientErrors.push(error.message))

    const response = await page.goto(url('/'), { waitUntil: 'hydration' })
    const bodyText = await page.locator('body').textContent()

    expect(response?.status()).toBe(200)
    expect(bodyText).toContain('Fixture page')
    expect(bodyText).toContain('Direct node body')
    expect(clientErrors).toEqual([])

    await page.close()
  })
})
