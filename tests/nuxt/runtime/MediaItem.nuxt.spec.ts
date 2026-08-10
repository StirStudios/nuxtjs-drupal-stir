import type { SlotsToolkit } from '../../../layers/theme/app/composables/useSlotsToolkit'
import { h, nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MediaItem from '../../../layers/theme/app/components/global/Media/Item.vue'

describe('MediaItem (Nuxt runtime)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('passes a contextual corner style to visual media', async () => {
    const wrapper = await mountSuspended(MediaItem, {
      props: {
        index: 0,
        node: h('div'),
        roundedClass: 'rounded-none',
        tk: {
          propsOf: () => ({
            alt: 'Full-width image',
            src: '/full-width.webp',
            type: 'image',
          }),
        } as Pick<SlotsToolkit, 'propsOf'>,
      },
    })

    expect(wrapper.get('.media').classes()).toContain('rounded-none')
    expect(wrapper.get('img').classes()).toContain('rounded-none')
  })

  it('applies a responsive height preset to the media wrapper', async () => {
    const wrapper = await mountSuspended(MediaItem, {
      props: {
        index: 0,
        node: h('div'),
        wrapperClass: 'h-[clamp(18rem,34vw,30rem)]',
        tk: {
          propsOf: () => ({
            alt: 'Wide location image',
            src: '/location.webp',
            type: 'image',
          }),
        } as Pick<SlotsToolkit, 'propsOf'>,
      },
    })

    expect(wrapper.get('.media').classes())
      .toContain('h-[clamp(18rem,34vw,30rem)]')
    expect(wrapper.get('img').classes()).toContain('h-full')
    expect(wrapper.get('img').classes()).toContain('object-cover')
  })

  it('keeps revealed media visible when reduced motion is requested', async () => {
    const matchMedia = vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
    )
    const mediaProps = {
      alt: 'Example logo',
      src: '/logo.webp',
      type: 'image' as const,
    }
    const wrapper = await mountSuspended(MediaItem, {
      props: {
        direction: 'fade-up',
        index: 0,
        node: h('div'),
        tk: {
          propsOf: () => mediaProps,
        } as Pick<SlotsToolkit, 'propsOf'>,
      },
    })

    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    expect(wrapper.html()).not.toContain('motion-safe:opacity-0')
  })

  it('keeps overlay media visible when no reveal direction is configured', async () => {
    const wrapper = await mountSuspended(MediaItem, {
      props: {
        index: 0,
        node: h('div'),
        overlay: true,
        tk: {
          propsOf: () => ({
            alt: 'Project detail',
            src: '/project-detail.webp',
            type: 'image',
          }),
        } as Pick<SlotsToolkit, 'propsOf'>,
      },
    })

    expect(wrapper.get('[aria-label="Open media modal"]').classes())
      .not.toContain('motion-safe:opacity-0')
  })

  it('uses the contextual delivery profile for gallery images', async () => {
    const wrapper = await mountSuspended(MediaItem, {
      props: {
        deliveryProfile: 'card',
        index: 0,
        node: h('div'),
        tk: {
          propsOf: () => ({
            alt: 'Gallery image',
            src: '/gallery.webp',
            type: 'image',
          }),
        } as Pick<SlotsToolkit, 'propsOf'>,
      },
    })

    expect(wrapper.get('img').attributes('sizes'))
      .toBe('(max-width: 767px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 400px')
  })

  it('preserves explicit delivery sizes over the contextual profile', async () => {
    const wrapper = await mountSuspended(MediaItem, {
      props: {
        deliveryProfile: 'card',
        index: 0,
        node: h('div'),
        tk: {
          propsOf: () => ({
            alt: 'Full-width image',
            deliverySizes: 'sm:100vw xl:960px',
            src: '/full.webp',
            type: 'image',
          }),
        } as Pick<SlotsToolkit, 'propsOf'>,
      },
    })

    expect(wrapper.get('img').attributes('sizes'))
      .toBe('(max-width: 1279px) 100vw, 960px')
  })

  it('preserves the hidden initial state for animated overlay media', async () => {
    const wrapper = await mountSuspended(MediaItem, {
      props: {
        direction: 'fade-up',
        index: 0,
        node: h('div'),
        overlay: true,
        tk: {
          propsOf: () => ({
            alt: 'Animated project detail',
            src: '/animated-project-detail.webp',
            type: 'image',
          }),
        } as Pick<SlotsToolkit, 'propsOf'>,
      },
    })

    expect(wrapper.get('[aria-label="Open media modal"]').classes())
      .toContain('motion-safe:opacity-0')
  })

  it('activates a deferred gallery source near the viewport', async () => {
    let callback: IntersectionObserverCallback | undefined
    const disconnect = vi.fn()

    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(observerCallback: IntersectionObserverCallback) {
          callback = observerCallback
        }

        disconnect = disconnect
        observe() {}
        takeRecords() { return [] }
        unobserve() {}
      },
    )

    const wrapper = await mountSuspended(MediaItem, {
      props: {
        deferLoad: true,
        index: 2,
        node: h('div'),
        tk: {
          propsOf: () => ({
            alt: 'Deferred gallery image',
            height: 800,
            src: '/gallery.webp',
            srcset: '/gallery-480.webp 480w, /gallery-640.webp 640w',
            type: 'image',
            width: 600,
          }),
        } as Pick<SlotsToolkit, 'propsOf'>,
      },
    })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('.media').attributes('aria-busy')).toBe('true')
    expect(callback).toBeTypeOf('function')

    callback!(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      { disconnect } as unknown as IntersectionObserver,
    )
    await nextTick()

    expect(wrapper.get('img').attributes('src')).toContain('/gallery.webp')
    expect(wrapper.get('.media').attributes('aria-busy')).toBeUndefined()
    expect(disconnect).toHaveBeenCalledOnce()

    await wrapper.setProps({ deferLoad: false })
    await wrapper.setProps({ deferLoad: true })

    expect(wrapper.get('img').attributes('src')).toContain('/gallery.webp')
    expect(wrapper.get('.media').attributes('aria-busy')).toBeUndefined()
  })
})
