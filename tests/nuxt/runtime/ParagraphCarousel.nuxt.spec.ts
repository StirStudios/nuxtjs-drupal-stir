import { useAppConfig } from '#imports'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, inject, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ParagraphCarousel from '../../../layers/theme/app/components/global/Paragraph/Carousel.vue'
import { carouselImageDeliverySizesKey } from '../../../layers/theme/app/utils/imageDelivery'

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
      stopOnInteraction: true,
      stopOnMouseEnter: false,
      stopOnFocusIn: false,
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

  it('lets nested Drupal node slides inherit the carousel delivery width', async () => {
    const NodeSlide = defineComponent({
      name: 'NodeSlide',
      props: {
        imageDeliveryProfile: String,
        uid: String,
      },
      setup: (props) => {
        const deliverySizes = inject(carouselImageDeliverySizesKey)

        return () => h(
          'article',
          {
            'data-delivery-profile': props.imageDeliveryProfile,
            'data-delivery-sizes': deliverySizes?.value,
          },
          'Nested node',
        )
      },
    })
    const wrapper = await mountSuspended(ParagraphCarousel, {
      props: {
        items: [
          h(NodeSlide, { uid: '2' }),
          h(NodeSlide, { uid: '3' }),
        ],
      },
    })

    expect(wrapper.find('[data-delivery-profile="card"]').exists()).toBe(false)
    expect(wrapper.getComponent(NodeSlide).props('imageDeliveryProfile')).toBeUndefined()
    expect(wrapper.get('[data-delivery-sizes]').attributes('data-delivery-sizes'))
      .toBe('sm:100vw md:100vw lg:100vw xl:100vw 2xl:100vw')
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

  it('renders marquee presentation with the native Nuxt UI marquee', async () => {
    const wrapper = await mountSuspended(ParagraphCarousel, {
      props: {
        presentation: 'marquee',
        carouselInterval: 5000,
        marqueeDuration: 100,
        marqueeOrientation: 'vertical',
        marqueeOverlay: true,
        marqueePauseOnHover: false,
        marqueeReverse: true,
        items: [h('a', { href: '/one' }, 'One'), h('a', { href: '/two' }, 'Two')],
      },
    })

    const marquee = wrapper.getComponent({ name: 'UMarquee' })

    expect(marquee.classes()).toContain('stir-marquee')
    expect(marquee.attributes('style')).toContain('--duration: 100s')
    expect(marquee.props('orientation')).toBe('vertical')
    expect(marquee.props('repeat')).toBe(4)
    expect(marquee.props('overlay')).toBe(true)
    expect(marquee.props('pauseOnHover')).toBe(false)
    expect(marquee.props('reverse')).toBe(true)
    expect(wrapper.findComponent({ name: 'UCarousel' }).exists()).toBe(false)
  })

  it.each(['carousel', 'marquee'])('keeps %s paused after focus leaves until explicitly resumed', async (presentation) => {
    const wrapper = await mountSuspended(ParagraphCarousel, {
      props: { presentation, items: [h('a', { href: '/one' }, 'One'), h('a', { href: '/two' }, 'Two')] },
    })
    const pause = wrapper.get('button[aria-controls]')

    expect(pause.text()).toBe('Pause automatic scrolling')
    await wrapper.get('a').trigger('focusin')
    await wrapper.get('a').trigger('focusout')
    expect(pause.text()).toBe('Start automatic scrolling')
    await pause.trigger('click')
    expect(pause.text()).toBe('Pause automatic scrolling')
    await pause.trigger('click')
    await wrapper.get('a').trigger('mouseleave')
    expect(pause.text()).toBe('Start automatic scrolling')
    wrapper.unmount()
  })

  it('uses efficient horizontal marquee defaults', async () => {
    const wrapper = await mountSuspended(ParagraphCarousel, {
      props: {
        presentation: 'marquee',
        items: [h('article', 'One'), h('article', 'Two')],
      },
    })
    const marquee = wrapper.getComponent({ name: 'UMarquee' })

    expect(marquee.props('orientation')).toBe('horizontal')
    expect(marquee.findAll('article')).toHaveLength(4)
    expect(marquee.props('overlay')).toBe(false)
    expect(marquee.props('pauseOnHover')).toBe(true)
    expect(marquee.props('reverse')).toBe(false)
  })

  it('lets consumers override horizontal repetition without changing vertical defaults', async () => {
    const theme = useAppConfig().stirTheme
    const previous = theme.carousel.marqueeRepeat.horizontal

    theme.carousel.marqueeRepeat.horizontal = 3

    try {
      const wrapper = await mountSuspended(ParagraphCarousel, {
        props: {
          presentation: 'marquee',
          items: [h('article', 'One'), h('article', 'Two')],
        },
      })

      expect(wrapper.getComponent({ name: 'UMarquee' }).findAll('article')).toHaveLength(6)
      expect(theme.carousel.marqueeRepeat.vertical).toBe(4)
      wrapper.unmount()
    } finally {
      theme.carousel.marqueeRepeat.horizontal = previous
    }
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
    expect(wrapper.findComponent({ name: 'UMarquee' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'UCarousel' }).exists()).toBe(false)
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
