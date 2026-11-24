import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { createPage, setup, url } from '@nuxt/test-utils/e2e'

// One source of truth for reveals (docs/plans/reveal-single-source.md): the
// same content must behave the same however the page arrived.
// - On screen when a server-rendered page appears: shown at once, no blink.
// - Below the screen: hidden until scrolled to, then revealed into place.
// - Drawn in the browser (soft navigation, ssr: false): reveals as it enters.
// - Reduced motion: everything at once.
// Tests marked KNOWN GAP fail on today's code by design; step 2 of the plan
// turns them into ordinary tests.

type Page = Awaited<ReturnType<typeof createPage>>

const text = (id: string, height = 420) => ({
  element: 'paragraph-text',
  props: { id, uuid: id, text: `<p class="reveal-row" style="min-height:${height}px">${id}</p>` },
})
const image = (mid: number, alt: string, height = 400) => ({
  element: 'media-image',
  props: { mid, type: 'image', src: `/${alt.replace(/\s+/g, '-')}.png`, alt, width: 600, height },
})
const page = (title: string, section: unknown[]) => ({
  title,
  breadcrumbs: [],
  metatags: { meta: [], link: [], jsonld: [] },
  content_format: 'json',
  content: { element: 'node-page', props: { title, type: 'page', hideTitle: true }, slots: { hero: [], section } },
  page_layout: 'default',
  footer_menu: [],
  site_info: { name: 'Fixture site', slogan: '', mail: '' },
  current_user: { id: 0, name: 'Anonymous', roles: ['anonymous'], capabilities: { editorialUi: false, adminMenu: false } },
  local_tasks: [],
  messages: [],
})

// Every kind of reveal on one page: a View whose first rows are on screen at
// load and whose rows mix text and media, single media with and without an
// Animation, and a gallery with an Animation (overlay media render through
// RevealMotion as-child).
const revealPage = page('Reveal', [
  {
    element: 'paragraph-view',
    props: { id: 'view', uuid: 'view', direction: 'fade-up' },
    slots: {
      content: [{
        element: 'drupal-view-reveal',
        props: { viewId: 'reveal', displayId: 'page' },
        slots: {
          rows: Array.from({ length: 8 }, (_, index) => index >= 5
            ? { element: 'paragraph-media', props: { id: `row-media-${index}`, uuid: `row-media-${index}`, direction: 'fade-up' }, slots: { media: [image(10 + index, `row media ${index}`, 420)] } }
            : text(`row-${index}`)),
        },
      }],
    },
  },
  { element: 'paragraph-media', props: { id: 'lead', uuid: 'lead' }, slots: { media: [image(1, 'lead media', 80)] } },
  { element: 'paragraph-media', props: { id: 'second', uuid: 'second', direction: 'fade-up' }, slots: { media: [image(2, 'second media', 80)] } },
  {
    element: 'paragraph-media',
    props: { id: 'gallery-anim', uuid: 'gallery-anim', overlay: true, direction: 'fade-up' },
    slots: { media: Array.from({ length: 6 }, (_, index) => image(30 + index, `animated gallery ${index}`)) },
  },
])

// A gallery with no Animation set, as one site's photo page is.
const galleryPage = page('Gallery', [
  text('gallery-spacer', 900),
  {
    element: 'paragraph-media',
    props: { id: 'gallery', uuid: 'gallery', overlay: true },
    slots: { media: Array.from({ length: 6 }, (_, index) => image(50 + index, `plain gallery ${index}`)) },
  },
])

const pages: Record<string, unknown> = {
  '/start': page('Start', [text('start')]),
  '/reveal': revealPage,
  '/spa/reveal': revealPage,
  '/gallery': galleryPage,
}

const drupalFixtureServer = createServer((request, response) => {
  const path = new URL(request.url || '/', 'http://127.0.0.1').pathname
  const pagePath = path.replace(/^\/ce-api/, '') || '/'
  const json = (status: number, body: unknown) => {
    response.writeHead(status, { 'content-type': 'application/json' })
    response.end(JSON.stringify(body))
  }

  if (path === '/api/app-context') return json(200, { blocks: {}, footer_menu: [], site_info: { name: 'Fixture site', mail: '', slogan: '' } })
  if (path.includes('/api/menu_items/')) return json(200, [])
  if (path.startsWith('/api/')) return json(200, {})
  // Images: a tiny PNG for every fixture source.
  if (path.endsWith('.png')) {
    response.writeHead(200, { 'content-type': 'image/png' })
    response.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'))
    return
  }

  const payload = pages[pagePath]

  json(payload ? 200 : 404, payload ?? { message: 'Not found' })
})

await new Promise<void>((resolve, reject) => {
  drupalFixtureServer.once('error', reject)
  drupalFixtureServer.listen(0, '127.0.0.1', resolve)
})

const address = drupalFixtureServer.address()

if (!address || typeof address === 'string') throw new Error('Unable to start the Drupal fixture server.')

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

// Record, from the first painted frame, the lowest opacity of every reveal
// that was on screen at that moment.
async function recordOnScreenOpacity(target: Page) {
  await target.addInitScript(() => {
    const lowest: Record<number, number> = {}

    Object.assign(window, { revealLowest: lowest })
    const sample = () => {
      document.querySelectorAll('.reveal-motion').forEach((row, index) => {
        if (row.getBoundingClientRect().top < innerHeight) {
          lowest[index] = Math.min(lowest[index] ?? 1, Number(getComputedStyle(row).opacity))
        }
      })
      requestAnimationFrame(sample)
    }

    requestAnimationFrame(sample)
  })
}

const hydrated = (target: Page) => target.waitForFunction(() =>
  Boolean((document.querySelector('#__nuxt') as { __vue_app__?: unknown } | null)?.__vue_app__))

const softNavigate = (target: Page, path: string) => target.evaluate(to =>
  (document.querySelector('#__nuxt') as unknown as { __vue_app__: { config: { globalProperties: { $router: { push: (path: string) => Promise<void> } } } } })
    .__vue_app__.config.globalProperties.$router.push(to), path)

type RevealState = { label: string, opacity: number, transform: string, onScreen: boolean }

const revealStates = (target: Page, selector = '.reveal-motion') => target.evaluate(sel =>
  [...document.querySelectorAll(sel)].map(row => ({
    label: (row.querySelector('img')?.getAttribute('alt') ?? row.textContent ?? '').trim().slice(0, 24),
    opacity: Number(getComputedStyle(row).opacity),
    transform: getComputedStyle(row).transform,
    onScreen: row.getBoundingClientRect().top < innerHeight && row.getBoundingClientRect().bottom >= 0,
  })), selector) as Promise<RevealState[]>

const inPlace = (state: RevealState) =>
  state.opacity === 1 && (state.transform === 'none' || state.transform === 'matrix(1, 0, 0, 1, 0, 0)')

// Scroll the whole page at a reading pace, then let reveals finish.
const scrollThrough = (target: Page) => target.evaluate(async () => {
  for (let y = 0; y <= document.documentElement.scrollHeight; y += 300) {
    window.scrollTo(0, y)
    await new Promise(resolve => setTimeout(resolve, 350))
  }
  await new Promise(resolve => setTimeout(resolve, 1500))
})

const knownGap = browserEnabled ? it.fails : it.skip
const browserIt = browserEnabled ? it : it.skip

describe('Reveals: one behaviour for every load path', async () => {
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
      // A signed-in visitor's page is rendered in the browser.
      routeRules: { '/spa/**': { ssr: false } },
      sourcemap: { client: false, server: false },
      vite: { build: { sourcemap: false } },
    },
  })

  describe('hard refresh (server-rendered)', () => {
    browserIt('shows what is on screen at once, without a blink', async () => {
      const target = await createPage()

      await recordOnScreenOpacity(target)
      await target.goto(url('/reveal'), { waitUntil: 'networkidle' })
      await hydrated(target)
      await target.waitForTimeout(1500)

      const lowest = await target.evaluate(() =>
        Object.values((window as unknown as { revealLowest: Record<number, number> }).revealLowest))

      expect(lowest.length, 'some reveals are on screen at load').toBeGreaterThan(0)
      expect(lowest.every(value => value === 1), 'no on-screen reveal dips below full opacity').toBe(true)
      await target.close()
    }, 60_000)

    browserIt('holds rows below the screen hidden, then reveals each into place', async () => {
      const target = await createPage()

      await target.goto(url('/reveal'), { waitUntil: 'networkidle' })
      await hydrated(target)
      await target.waitForTimeout(500)

      const belowRows = (await revealStates(target))
        .filter(state => !state.onScreen && !state.label.startsWith('animated gallery'))

      expect(belowRows.length).toBeGreaterThan(0)
      expect(belowRows.filter(state => state.opacity !== 0).map(state => state.label), 'rows below the screen wait hidden').toEqual([])

      await scrollThrough(target)
      const notInPlace = (await revealStates(target)).filter(state => !inPlace(state)).map(state => `${state.label} ${state.opacity} ${state.transform}`)

      expect(notInPlace, 'every reveal ends visible and in place').toEqual([])
      await target.close()
    }, 90_000)

    browserIt('keeps revealed content in place when the page re-renders afterwards', async () => {
      const target = await createPage()

      await target.goto(url('/reveal'), { waitUntil: 'networkidle' })
      await hydrated(target)
      await scrollThrough(target)
      // A width change re-measures and re-renders every image.
      await target.setViewportSize({ width: 900, height: 800 })
      await target.waitForTimeout(800)
      await target.setViewportSize({ width: 1280, height: 800 })
      await target.waitForTimeout(800)

      const notInPlace = (await revealStates(target)).filter(state => !inPlace(state)).map(state => `${state.label} ${state.transform}`)

      expect(notInPlace).toEqual([])
      await target.close()
    }, 90_000)

    browserIt('holds an animated gallery (as-child) hidden below the screen', async () => {
      const target = await createPage()

      await target.goto(url('/reveal'), { waitUntil: 'networkidle' })
      await hydrated(target)
      await target.waitForTimeout(500)

      const gallery = (await revealStates(target)).filter(state => state.label.startsWith('animated gallery') && !state.onScreen)

      expect(gallery.length).toBeGreaterThan(0)
      expect(gallery.every(state => state.opacity === 0)).toBe(true)
      await target.close()
    }, 60_000)

    knownGap('KNOWN GAP: reveals a gallery with no Animation set as it is scrolled to', async () => {
      const target = await createPage()

      await target.goto(url('/gallery'), { waitUntil: 'networkidle' })
      await hydrated(target)
      await target.waitForTimeout(500)

      const opacityOf = () => target.evaluate(() => [...document.querySelectorAll('img[alt^="plain gallery"]')]
        .map(img => Number(getComputedStyle(img.closest('.reveal-motion') ?? img).opacity)))
      const atLoad = await opacityOf()

      expect(atLoad.length).toBeGreaterThan(0)
      expect(atLoad.every(opacity => opacity === 0), 'gallery images below the screen wait to reveal').toBe(true)
      await scrollThrough(target)
      expect((await opacityOf()).every(opacity => opacity === 1)).toBe(true)
      await target.close()
    }, 90_000)
  })

  describe('soft navigation (drawn in the browser)', () => {
    browserIt('reveals rows into place as they are scrolled to', async () => {
      const target = await createPage()

      await target.goto(url('/start'), { waitUntil: 'networkidle' })
      await hydrated(target)
      await softNavigate(target, '/reveal')
      await target.waitForSelector('.reveal-motion')
      await target.waitForTimeout(500)

      const below = (await revealStates(target)).filter(state => !state.onScreen)

      expect(below.length).toBeGreaterThan(0)
      expect(below.every(state => state.opacity === 0), 'rows below the screen wait hidden').toBe(true)

      await scrollThrough(target)
      const notInPlace = (await revealStates(target)).filter(state => !inPlace(state)).map(state => `${state.label} ${state.opacity} ${state.transform}`)

      expect(notInPlace).toEqual([])
      await target.close()
    }, 90_000)
  })

  describe('signed-in first load (ssr: false)', () => {
    browserIt('reveals rows into place as they are scrolled to', async () => {
      const target = await createPage()

      await target.goto(url('/spa/reveal'), { waitUntil: 'networkidle' })
      await target.waitForSelector('.reveal-motion')
      await target.waitForTimeout(500)

      const below = (await revealStates(target)).filter(state => !state.onScreen)

      expect(below.length).toBeGreaterThan(0)
      expect(below.every(state => state.opacity === 0), 'rows below the screen wait hidden').toBe(true)

      await scrollThrough(target)
      const notInPlace = (await revealStates(target)).filter(state => !inPlace(state)).map(state => `${state.label} ${state.opacity} ${state.transform}`)

      expect(notInPlace).toEqual([])
      await target.close()
    }, 90_000)
  })

  describe('reduced motion', () => {
    for (const [label, path, soft] of [['hard refresh', '/reveal', false], ['soft navigation', '/reveal', true], ['signed-in first load', '/spa/reveal', false]] as const) {
      browserIt(`shows everything at once on a ${label}`, async () => {
        const target = await createPage()

        await target.emulateMedia({ reducedMotion: 'reduce' })
        if (soft) {
          await target.goto(url('/start'), { waitUntil: 'networkidle' })
          await hydrated(target)
          await softNavigate(target, path)
        }
        else {
          await target.goto(url(path), { waitUntil: 'networkidle' })
        }
        await target.waitForSelector('.reveal-motion')
        await target.waitForTimeout(800)

        const hidden = (await revealStates(target)).filter(state => !inPlace(state)).map(state => state.label)

        expect(hidden, 'nothing waits hidden under reduced motion').toEqual([])
        await target.close()
      }, 60_000)
    }
  })
})
