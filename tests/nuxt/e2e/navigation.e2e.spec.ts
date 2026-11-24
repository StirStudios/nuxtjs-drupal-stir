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
  '/reveal': {
    ...pageFixture('Reveal', 'Reveal page body'),
    content: {
      element: 'node-page',
      props: { title: 'Reveal', type: 'page', hideTitle: true },
      slots: {
        hero: [],
        // The lead image never reveals; the next media on screen must not
        // blink; the rows below include media that reveals on scroll.
        section: [{
          element: 'paragraph-media',
          props: { id: 'lead-media', uuid: 'lead-media' },
          slots: {
            media: [{ element: 'media-image', props: { mid: 2, type: 'image', src: '/lead-media.png', alt: 'lead-media', width: 600, height: 80 } }],
          },
        }, {
          element: 'paragraph-media',
          props: { id: 'second-media', uuid: 'second-media', direction: 'fade-up' },
          slots: {
            media: [{ element: 'media-image', props: { mid: 3, type: 'image', src: '/second-media.png', alt: 'second-media', width: 600, height: 80 } }],
          },
        }, {
          element: 'paragraph-view',
          props: { id: 'reveal-view', uuid: 'reveal-view', direction: 'fade-up' },
          slots: {
            content: [{
              element: 'drupal-view-reveal',
              props: { viewId: 'reveal', displayId: 'page' },
              slots: {
                rows: Array.from({ length: 8 }, (_, index) => index >= 5
                  ? {
                      element: 'paragraph-media',
                      props: { id: `row-media-${index}`, uuid: `row-media-${index}`, direction: 'fade-up' },
                      slots: { media: [{ element: 'media-image', props: { mid: 10 + index, type: 'image', src: `/row-media-${index}.png`, alt: index === 5 ? 'row media' : `row media ${index}`, width: 600, height: 420 } }] },
                    }
                  : {
                      element: 'paragraph-text',
                      props: { id: `row-${index}`, uuid: `row-${index}`, text: `<p class="reveal-row" style="min-height:420px">Row ${index}</p>` },
                    }),
              },
            }],
          },
        }],
      },
    },
  },
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

  it.runIf(browserEnabled)('keeps on-screen reveals visible through hydration and reveals the rest on scroll', async () => {
    const page = await createPage()

    // Record the lowest opacity each row reaches from the first paint on.
    await page.addInitScript(() => {
      const lowest: Record<number, number> = {}

      Object.assign(window, { lowestRowOpacity: lowest })
      const sample = () => {
        document.querySelectorAll('.reveal-motion').forEach((row, index) => {
          const opacity = Number(getComputedStyle(row).opacity)

          lowest[index] = Math.min(lowest[index] ?? 1, opacity)
        })
        requestAnimationFrame(sample)
      }

      requestAnimationFrame(sample)
    })
    await page.goto(url('/reveal'), { waitUntil: 'networkidle' })
    await page.waitForFunction(() => Boolean((document.querySelector('#__nuxt') as { __vue_app__?: unknown } | null)?.__vue_app__))
    await page.waitForTimeout(1500)

    const rows = await page.evaluate(() => [...document.querySelectorAll('.reveal-motion')].map((row, index) => ({
      onScreen: row.getBoundingClientRect().top < innerHeight,
      lowest: (window as unknown as { lowestRowOpacity: Record<number, number> }).lowestRowOpacity[index] ?? 1,
      opacity: Number(getComputedStyle(row).opacity),
    })))

    expect(rows.length).toBeGreaterThan(2)
    for (const row of rows.filter(row => row.onScreen)) {
      expect(row.lowest, 'an on-screen row never blinks out').toBe(1)
    }

    // Media below the screen waits and reveals too.
    const mediaBelow = await page.evaluate(() => [...document.querySelectorAll('.reveal-motion')]
      .findIndex(row => row.querySelector('img[alt="row media"]') && row.getBoundingClientRect().top > innerHeight))

    expect(mediaBelow, 'the row media starts below the screen').toBeGreaterThan(-1)
    expect(rows[mediaBelow]!.opacity, 'media below the screen waits to reveal').toBe(0)

    const below = rows.findIndex(row => !row.onScreen)

    expect(below, 'some rows start below the screen').toBeGreaterThan(-1)
    expect(rows[below]!.opacity, 'rows below the screen wait to reveal').toBe(0)
    await page.evaluate(index => document.querySelectorAll('.reveal-motion')[index]?.scrollIntoView({ block: 'center' }), below)
    await page.waitForFunction(index => Number(getComputedStyle(document.querySelectorAll('.reveal-motion')[index]!).opacity) === 1, below)
    // Revealed means back in place too, not faded in but still offset.
    await page.waitForTimeout(1200)
    expect(await page.evaluate(index => {
      const transform = getComputedStyle(document.querySelectorAll('.reveal-motion')[index]!).transform

      return transform === 'none' || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(transform)
    }, below), 'a revealed row ends in place').toBe(true)
    await page.evaluate(index => document.querySelectorAll('.reveal-motion')[index]?.scrollIntoView({ block: 'center' }), mediaBelow)
    await page.waitForFunction(index => Number(getComputedStyle(document.querySelectorAll('.reveal-motion')[index]!).opacity) === 1, mediaBelow)
    await page.close()
  }, 60_000)

  it.runIf(browserEnabled)('reveals every row into place after a hard refresh', async () => {
    const page = await createPage()

    await page.goto(url('/reveal'), { waitUntil: 'networkidle' })
    await page.waitForFunction(() => Boolean((document.querySelector('#__nuxt') as { __vue_app__?: unknown } | null)?.__vue_app__))

    const stuck = await page.evaluate(async () => {
      const result: string[] = []

      for (const row of [...document.querySelectorAll('.reveal-motion')]) {
        row.scrollIntoView({ block: 'center' })
        await new Promise(resolve => setTimeout(resolve, 900))
      }
      // Rows re-render as their images settle; give them time, then look.
      await new Promise(resolve => setTimeout(resolve, 800))
      for (const row of [...document.querySelectorAll('.reveal-motion')]) {
        const style = getComputedStyle(row)

        if (Number(style.opacity) < 1 || (style.transform !== 'none' && !/^matrix\(1, 0, 0, 1, 0, 0\)$/.test(style.transform))) {
          result.push(`${row.textContent?.trim().slice(0, 20)}: ${style.opacity} ${style.transform}`)
        }
      }

      return result
    })

    expect(stuck, 'every row ends visible and in place after a hard refresh').toEqual([])
    await page.close()
  }, 90_000)

  it.runIf(browserEnabled)('reveals rows into place on a page rendered in the browser', async () => {
    const page = await createPage()

    // Arrive by client navigation, as a signed-in visitor's browser renders it.
    await page.goto(url('/first'), { waitUntil: 'networkidle' })
    await page.waitForFunction(() => Boolean((document.querySelector('#__nuxt') as { __vue_app__?: unknown } | null)?.__vue_app__))
    await page.evaluate(() => (document.querySelector('#__nuxt') as unknown as { __vue_app__: { config: { globalProperties: { $router: { push: (path: string) => Promise<void> } } } } }).__vue_app__.config.globalProperties.$router.push('/reveal'))
    await page.waitForSelector('.reveal-motion')
    await page.waitForTimeout(800)

    const offsets = async () => page.evaluate(() => [...document.querySelectorAll('.reveal-motion')].map((row) => {
      row.scrollIntoView({ block: 'center' })

      return row
    }).length)

    await offsets()
    await page.waitForTimeout(1500)
    const stuck = await page.evaluate(async () => {
      const rows = [...document.querySelectorAll('.reveal-motion')]
      const result: string[] = []

      for (const row of rows) {
        row.scrollIntoView({ block: 'center' })
        await new Promise(resolve => setTimeout(resolve, 900))
        const style = getComputedStyle(row)

        if (Number(style.opacity) === 1 && style.transform !== 'none' && !/^matrix\(1, 0, 0, 1, 0, 0\)$/.test(style.transform)) result.push(style.transform)
      }

      return result
    })

    expect(stuck, 'no revealed row stays offset').toEqual([])
    await page.close()
  }, 90_000)

  it.runIf(browserEnabled)('shows everything at once when reduced motion is requested', async () => {
    const page = await createPage()

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(url('/reveal'), { waitUntil: 'networkidle' })
    await page.waitForFunction(() => Boolean((document.querySelector('#__nuxt') as { __vue_app__?: unknown } | null)?.__vue_app__))
    await page.waitForTimeout(500)

    const hidden = await page.evaluate(() => [...document.querySelectorAll('.reveal-motion')]
      .filter(row => Number(getComputedStyle(row).opacity) < 1).length)

    expect(hidden, 'no reveal waits hidden under reduced motion').toBe(0)
    await page.close()
  }, 60_000)

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

