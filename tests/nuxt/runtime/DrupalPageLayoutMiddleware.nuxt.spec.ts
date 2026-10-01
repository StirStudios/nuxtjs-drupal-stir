import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { RouteMiddleware } from '#app'
import type { RouteLocationNormalized } from '#vue-router'
import plugin from '../../../layers/theme/app/plugins/drupalPageLayout.client'
import { pageFetchOptions } from '../../../layers/theme/app/utils/pageRequest'

const state = vi.hoisted(() => ({
  middleware: undefined as RouteMiddleware | undefined,
  ceApi: vi.fn(),
  preload: vi.fn(),
}))

mockNuxtImport('addRouteMiddleware', () => (_name: string, middleware: RouteMiddleware) => {
  state.middleware = middleware
})
mockNuxtImport('preloadRouteComponents', () => state.preload)
vi.mock('../../../layers/theme/app/composables/useStirDrupalCe', () => ({
  useStirDrupalCe: () => ({ $ceApi: (options: unknown) => (path: string) => state.ceApi(path, options) }),
}))

type TestApp = Parameters<typeof plugin>[0] & { $router: { currentRoute: { value: { fullPath: string } } } }

const nuxtApp = {
  isHydrating: false,
  payload: { data: {}, serverRendered: false },
  static: { data: {} },
  $router: { currentRoute: { value: { fullPath: '/' } } },
  runWithContext: <T>(fn: () => T) => fn(),
} as unknown as TestApp

function route(fullPath: string, meta: Record<string, unknown> = { drupalPage: true }, pageMeta: Record<string, unknown> = {}) {
  const url = new URL(fullPath, 'http://site.test')

  return {
    path: url.pathname,
    fullPath,
    query: Object.fromEntries(url.searchParams),
    meta: { ...meta },
    matched: [{ meta: pageMeta }],
  } as unknown as RouteLocationNormalized
}

async function navigate(to: RouteLocationNormalized) {
  await state.middleware!(to, route('/'))
  nuxtApp.$router.currentRoute.value.fullPath = to.fullPath

  return to.meta.layout
}

// What the page's fetchPage() gets from the payload cache.
const pageCache = (cause = 'initial') =>
  pageFetchOptions().getCachedData('page-key', nuxtApp as never, { cause })

beforeEach(() => {
  state.ceApi.mockReset()
  state.preload.mockReset()
  Object.assign(nuxtApp, { isHydrating: false })
  nuxtApp.payload.serverRendered = false
  ;(plugin as unknown as (app: TestApp) => void)(nuxtApp)
})

describe('Drupal page layout before render, in the browser', () => {
  it('puts the page_layout on the route, and hands the payload to the page once', async () => {
    const page = { page_layout: 'links', title: 'Links' }

    state.ceApi.mockResolvedValue(page)

    expect(await navigate(route('/links?tab=1#top'))).toBe('links')
    expect(state.ceApi).toHaveBeenCalledWith('/links', { query: { tab: '1' } })
    expect(state.preload).toHaveBeenCalledOnce()
    expect(pageCache()).toBe(page)
    // A second fetch, such as a refresh, goes to Drupal.
    expect(pageCache()).toBeUndefined()
  })

  it('takes a site layout as named, and default when Drupal names none', async () => {
    state.ceApi.mockResolvedValueOnce({ page_layout: 'clients' }).mockResolvedValueOnce({})

    expect(await navigate(route('/work'))).toBe('clients')
    expect(await navigate(route('/about'))).toBe('default')
  })

  it('does not hand the payload to a refresh or another route', async () => {
    state.ceApi.mockResolvedValue({ page_layout: 'clear' })

    await navigate(route('/one'))
    expect(pageCache('refresh:manual')).toBeUndefined()

    await state.middleware!(route('/two'), route('/one'))
    expect(pageCache()).toBeUndefined()
  })

  it('leaves the layout alone when the page cannot be fetched', async () => {
    state.ceApi.mockRejectedValue(new Error('404'))

    expect(await navigate(route('/missing'))).toBeUndefined()
    expect(pageCache()).toBeUndefined()
  })

  it('leaves the layout of non-Drupal, ?page= and self-named routes, and of a server-rendered first load', async () => {
    expect(await navigate(route('/dashboard', {}))).toBeUndefined()
    expect(await navigate(route('/news?page=2'))).toBeUndefined()
    expect(await navigate(route('/class', { drupalPage: true }, { layout: 'app' }))).toBeUndefined()

    Object.assign(nuxtApp, { isHydrating: true })
    nuxtApp.payload.serverRendered = true
    expect(await navigate(route('/about'))).toBeUndefined()
    expect(state.ceApi).not.toHaveBeenCalled()
  })

  it('fetches a browser-rendered first load, as signed-in requests are', async () => {
    Object.assign(nuxtApp, { isHydrating: true })
    state.ceApi.mockResolvedValue({ page_layout: 'clear' })

    expect(await navigate(route('/about'))).toBe('clear')
  })
})
