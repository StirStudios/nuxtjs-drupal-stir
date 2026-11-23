import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { createPage, fetch, setup, url } from '@nuxt/test-utils/e2e'

// Pins how shared UI follows Drupal pages during client navigation, the
// behaviour the nuxtjs-drupal-ce replacement must keep
// (docs/plans/own-drupal-ce.md, Phase 0). Shared UI outside the page must
// keep the outgoing page until the destination renders: never the next
// page early and never an empty page.
const SLOW_PAGE_DELAY_MS = 1200

const pageFixture = (title: string, body: string, link?: { url: string, title: string }) => ({
  title,
  breadcrumbs: [{ frontpage: true, url: '/', label: 'Home' }],
  metatags: { meta: [], link: [], jsonld: [] },
  content_format: 'json',
  content: {
    element: 'node-page',
    props: { title, type: 'page', hideTitle: true },
    slots: {
      hero: [],
      section: [
        { element: 'paragraph-text', props: { id: `${title}-text`, uuid: `${title}-text`, text: `<p id="page-body">${body}</p>` } },
        ...(link
          ? [{ element: 'paragraph-button', props: { id: `${title}-button`, uuid: `${title}-button`, link } }]
          : []),
      ],
    },
  },
  page_layout: 'default',
  footer_menu: [],
  site_info: { name: 'Fixture site', slogan: '', mail: '' },
  current_user: { id: 0, name: 'Anonymous', roles: ['anonymous'], capabilities: { editorialUi: false, adminMenu: false } },
  local_tasks: [],
  messages: [],
})

const pages: Record<string, unknown> = {
  '/first': pageFixture('First', 'First page body', { url: '/second', title: 'Go to second' }),
  '/second': pageFixture('Second', 'Second page body', { url: '/old-path', title: 'Go to old path' }),
  '/old-path': {
    ...pageFixture('', ''),
    content: { props: [], slots: { section: [], hero: [] } },
    redirect: { external: false, url: '/first', statusCode: 301 },
  },
}

const drupalFixtureServer = createServer((request, response) => {
  const path = new URL(request.url || '/', 'http://127.0.0.1').pathname
  const pagePath = path.replace(/^\/ce-api/, '') || '/'

  if (path === '/api/app-context') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ blocks: {}, footer_menu: [], site_info: { name: 'Fixture site', mail: '', slogan: '' } }))
    return
  }
  if (path.includes('/api/menu_items/') || path.startsWith('/api/')) {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(path.includes('/api/menu_items/') ? '[]' : '{}')
    return
  }

  const payload = pages[pagePath]
  const send = () => {
    response.writeHead(payload ? 200 : 404, { 'content-type': 'application/json' })
    response.end(JSON.stringify(payload ?? { ...pageFixture('Page not found', 'Missing'), content: { element: 'drupal-markup', slots: { default: 'Missing' }, props: [] } }))
  }

  if (pagePath === '/second') setTimeout(send, SLOW_PAGE_DELAY_MS)
  else send()
})

await new Promise<void>((resolve, reject) => {
  drupalFixtureServer.once('error', reject)
  drupalFixtureServer.listen(0, '127.0.0.1', resolve)
})

const address = drupalFixtureServer.address()

if (!address || typeof address === 'string') {
  throw new Error('Unable to start the Drupal fixture server.')
}

const drupalFixtureUrl = `http://127.0.0.1:${address.port}`
const browserEnabled = process.env.CI === 'true' || process.env.STIR_E2E_BROWSER === 'true'
const originalDrupalUrl = process.env.DRUPAL_URL

process.env.DRUPAL_URL = drupalFixtureUrl

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    drupalFixtureServer.close(error => error ? reject(error) : resolve())
  })
  if (originalDrupalUrl === undefined) Reflect.deleteProperty(process.env, 'DRUPAL_URL')
  else process.env.DRUPAL_URL = originalDrupalUrl
})

describe('Drupal page navigation', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../../fixtures/navigation-consumer', import.meta.url)),
    setupTimeout: 300_000,
    browser: browserEnabled,
    env: {
      DRUPAL_API_KEY: 'fixture-api-key',
      DRUPAL_URL: drupalFixtureUrl,
      NUXT_SITE_URL: 'http://127.0.0.1',
      NUXT_INDEXABLE: 'false',
    },
    nuxtConfig: {
      sourcemap: { client: false, server: false },
      vite: { build: { sourcemap: false } },
    },
  })

  it('renders the shared probe and page on the server', async () => {
    const html = await (await fetch('/first')).text()

    expect(html).toContain('<p id="shared-title">First</p>')
    expect(html).toContain('First page body')
  })

  it('answers a Drupal redirect on the server', async () => {
    const response = await fetch('/old-path', { redirect: 'manual' })

    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe('/first')
  })

  it('answers 404 for a missing Drupal page', async () => {
    expect((await fetch('/missing-page')).status).toBe(404)
  })

  it.runIf(browserEnabled)('keeps shared UI on the outgoing page until the destination renders', async () => {
    const page = await createPage()

    await page.goto(url('/first'), { waitUntil: 'networkidle' })
    await page.waitForFunction(() => Boolean((document.querySelector('#__nuxt') as { __vue_app__?: unknown } | null)?.__vue_app__))
    expect(await page.textContent('#shared-title')).toBe('First')

    // Record every DOM state the visitor could see during the navigation.
    await page.evaluate(() => {
      const samples: Array<[string, string]> = []
      const sample = () => samples.push([
        document.querySelector('#shared-title')?.textContent ?? '',
        document.querySelector('#page-body')?.textContent ?? '',
      ])

      new MutationObserver(sample).observe(document.body, { subtree: true, childList: true, characterData: true })
      Object.assign(window, { navigationSamples: samples })
    })

    await page.getByRole('link', { name: 'Go to second' }).click()
    await page.waitForTimeout(SLOW_PAGE_DELAY_MS / 2)
    expect(await page.textContent('#shared-title')).toBe('First')
    expect(await page.textContent('#page-body')).toBe('First page body')

    await page.waitForFunction(() => document.querySelector('#page-body')?.textContent === 'Second page body')
    await page.waitForFunction(() => document.querySelector('#shared-title')?.textContent === 'Second')

    const samples = await page.evaluate(() => (window as unknown as { navigationSamples: Array<[string, string]> }).navigationSamples)

    for (const [shared, body] of samples) {
      expect(shared, 'shared UI never shows an empty page').not.toBe('(empty)')
      if (body === 'First page body') expect(shared, 'shared UI never runs ahead of the page').toBe('First')
    }

    await page.goBack()
    await page.waitForFunction(() => document.querySelector('#page-body')?.textContent === 'First page body')
    expect(await page.textContent('#shared-title')).toBe('First')

    await page.goForward()
    await page.waitForFunction(() => document.querySelector('#shared-title')?.textContent === 'Second')

    // A Drupal redirect during client navigation lands on its target.
    await page.getByRole('link', { name: 'Go to old path' }).click()
    await page.waitForURL(url('/first'))
    await page.waitForFunction(() => document.querySelector('#page-body')?.textContent === 'First page body')
    expect(await page.textContent('#shared-title')).toBe('First')
    await page.close()
  }, 60_000)
})

