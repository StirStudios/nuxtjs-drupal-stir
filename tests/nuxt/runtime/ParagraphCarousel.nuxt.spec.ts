import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ParagraphCarousel from '../../../layers/theme/app/components/global/Paragraph/Carousel.vue'

const preferredMotion = ref<'no-preference' | 'reduce'>('no-preference')

vi.mock('@vueuse/core', async (importOriginal) => {
  const original = await importOriginal<typeof import('@vueuse/core')>()

  return {
    ...original,
    useIntersectionObserver: (
      _target: unknown,
      _callback: (entries: Array<{ isIntersecting: boolean }>) => void,
    ) => {
      return {
        isSupported: ref(true),
        stop: vi.fn(),
      }
    },
    usePreferredReducedMotion: () => preferredMotion,
  }
})

describe('ParagraphCarousel (Nuxt runtime)', () => {
  beforeEach(() => {
    preferredMotion.value = 'no-preference'
  })

  it('passes the exact Drupal interval to Nuxt UI without starting off-screen', async () => {
    const wrapper = await mountSuspended(ParagraphCarousel, {
      props: {
        carouselInterval: 10000,
        items: [h('article', 'One'), h('article', 'Two')],
      },
    })

    expect(wrapper.getComponent({ name: 'UCarousel' }).props('autoplay')).toMatchObject({
      delay: 10000,
      playOnInit: false,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  })

  it('disables automatic motion when reduced motion is preferred', async () => {
    preferredMotion.value = 'reduce'

    const wrapper = await mountSuspended(ParagraphCarousel, {
      props: {
        carouselAutoscroll: false,
        carouselInterval: 10000,
        items: [h('article', 'One'), h('article', 'Two')],
      },
    })

    expect(wrapper.getComponent({ name: 'UCarousel' }).props('autoplay')).toBe(false)
    expect(wrapper.getComponent({ name: 'UCarousel' }).props('autoScroll')).toBe(false)
  })

  it('releases arrow focus after pointer activation', async () => {
    const wrapper = await mountSuspended(ParagraphCarousel, {
      props: {
        items: [h('article', 'One'), h('article', 'Two')],
      },
    })
    const arrow = document.createElement('button')

    arrow.dataset.slot = 'next'
    const blur = vi.spyOn(arrow, 'blur')

    wrapper.element.append(arrow)

    arrow.dispatchEvent(new Event('pointerup', { bubbles: true }))

    expect(blur).toHaveBeenCalledOnce()
  })
})
