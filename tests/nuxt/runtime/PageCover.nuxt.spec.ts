import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { NavigationGuardWithThis, RouteLocationNormalized } from 'vue-router'
import { updateAppConfig, useNuxtApp, useRouter } from '#imports'
import PageCover from '../../../layers/theme/app/components/App/PageCover.vue'

type Guard = NavigationGuardWithThis<undefined>

function mockMotion(reduce: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as MediaQueryList)
}

function route(fullPath: string) {
  const [path = '/'] = fullPath.split('?')

  return { path, fullPath } as RouteLocationNormalized
}

async function mountCover() {
  const router = useRouter()
  const beforeEach = vi.spyOn(router, 'beforeEach')
  const wrapper = await mountSuspended(PageCover)
  const guard = beforeEach.mock.calls.at(-1)?.[0] as Guard
  const navigate = (from: string, to: string) =>
    (guard as (to: RouteLocationNormalized, from: RouteLocationNormalized) => unknown)(route(to), route(from))

  return { wrapper, navigate }
}

const panel = () => document.querySelector<HTMLElement>('.stir-page-cover')

describe('AppPageCover', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    updateAppConfig({ stirTheme: { pageTransition: { type: 'cover', cover: { shape: 'circle' } } } })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    updateAppConfig({ stirTheme: { pageTransition: { type: 'none', cover: { shape: 'circle' } } } })
  })

  it('covers the page from the pointer, then reveals the new page', async () => {
    mockMotion(false)
    const { wrapper, navigate } = await mountCover()

    document.body.dispatchEvent(new PointerEvent('pointerdown', { clientX: 10, clientY: 20, bubbles: true }))
    const pending = navigate('/', '/about')

    await nextTick()

    expect(panel()?.getAttribute('style')).toContain('10px 20px')
    expect(panel()?.getAttribute('aria-hidden')).toBe('true')
    expect(document.documentElement.hasAttribute('data-page-transition')).toBe(true)
    expect(document.documentElement.style.overflow).toBe('hidden')

    await vi.advanceTimersByTimeAsync(620)
    await pending
    await useNuxtApp().callHook('page:finish')
    await vi.advanceTimersByTimeAsync(720)

    expect(panel()).toBeNull()
    expect(document.documentElement.hasAttribute('data-page-transition')).toBe(false)
    expect(document.documentElement.style.overflow).toBe('')
    wrapper.unmount()
  })

  it('starts from the corner without a pointer and stays under the header and admin bar', async () => {
    mockMotion(false)
    const { wrapper, navigate } = await mountCover()

    void navigate('/', '/about')
    await nextTick()

    expect(panel()?.getAttribute('style')).toContain('100% 0%')
    expect(Number(panel()?.style.zIndex)).toBeLessThan(50)
    wrapper.unmount()
    expect(document.documentElement.hasAttribute('data-page-transition')).toBe(false)
  })

  it('reveals after six seconds if the page never finishes', async () => {
    mockMotion(false)
    const { wrapper, navigate } = await mountCover()

    const pending = navigate('/', '/slow')

    await vi.advanceTimersByTimeAsync(620)
    await pending
    await vi.advanceTimersByTimeAsync(6000 + 720)

    expect(panel()).toBeNull()
    wrapper.unmount()
  })

  it('navigates instantly with reduced motion', async () => {
    mockMotion(true)
    const { wrapper, navigate } = await mountCover()

    await navigate('/', '/about')
    await nextTick()

    expect(panel()).toBeNull()
    expect(document.documentElement.hasAttribute('data-page-transition')).toBe(false)
    wrapper.unmount()
  })

  it('ignores query and hash changes on the same page', async () => {
    mockMotion(false)
    const { wrapper, navigate } = await mountCover()

    await navigate('/news', '/news?page=2')
    await nextTick()

    expect(panel()).toBeNull()
    wrapper.unmount()
  })
})
