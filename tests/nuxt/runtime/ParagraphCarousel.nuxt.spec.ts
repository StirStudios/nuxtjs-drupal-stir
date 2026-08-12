import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, ref } from 'vue'
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

  it('does not initialize autoplay for a single slide', async () => {
    const wrapper = await mountSuspended(ParagraphCarousel, {
      props: {
        carouselInterval: 10000,
        items: [h('article', 'Only slide')],
      },
    })

    expect(wrapper.getComponent({ name: 'UCarousel' }).props('autoplay')).toBe(false)
  })

  it('does not initialize auto-scroll for a single slide', async () => {
    const wrapper = await mountSuspended(ParagraphCarousel, {
      props: {
        carouselAutoscroll: true,
        items: [h('article', 'Only slide')],
      },
    })

    expect(wrapper.getComponent({ name: 'UCarousel' }).props('autoScroll')).toBe(false)
  })

  it('passes an explicit card profile to nested Drupal node slides', async () => {
    const NodeSlide = defineComponent({
      name: 'NodeSlide',
      props: {
        imageDeliveryProfile: String,
        uid: String,
      },
      setup: props => () => h(
        'article',
        { 'data-delivery-profile': props.imageDeliveryProfile },
        'Nested node',
      ),
    })
    const wrapper = await mountSuspended(ParagraphCarousel, {
      props: {
        items: [
          h(NodeSlide, { uid: '2' }),
          h(NodeSlide, { uid: '3' }),
        ],
      },
    })

    expect(wrapper.find('[data-delivery-profile="card"]').exists()).toBe(true)
    expect(wrapper.getComponent(NodeSlide).props('imageDeliveryProfile')).toBe('card')
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

  it('renders marquee presentation with continuous Nuxt UI auto-scroll', async () => {
    const wrapper = await mountSuspended(ParagraphCarousel, {
      props: {
        presentation: 'marquee',
        carouselInterval: 5000,
        items: [h('a', { href: '/one' }, 'One'), h('a', { href: '/two' }, 'Two')],
      },
    })

    const carousel = wrapper.getComponent({ name: 'UCarousel' })

    expect(carousel.classes()).toContain('stir-marquee')
    expect(carousel.props('autoScroll')).toMatchObject({
      startDelay: 0,
      stopOnMouseEnter: true,
      stopOnInteraction: false,
    })
    expect(carousel.props('arrows')).toBe(false)
    expect(carousel.props('dots')).toBe(false)
  })

  it('omits the marquee pause control when reduced motion is preferred', async () => {
    preferredMotion.value = 'reduce'

    const wrapper = await mountSuspended(ParagraphCarousel, {
      props: {
        presentation: 'marquee',
        items: [h('article', 'One'), h('article', 'Two')],
      },
    })

    expect(wrapper.find('.stir-marquee').exists()).toBe(true)
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.getComponent({ name: 'UCarousel' }).props('autoScroll')).toBe(false)
  })

  it('keeps legacy media when the ordered items slot is empty', async () => {
    const wrapper = await mountSuspended(ParagraphCarousel, {
      slots: {
        items: () => [],
        media: () => h('article', 'Legacy media'),
      },
    })

    expect(wrapper.text()).toContain('Legacy media')
  })
})
