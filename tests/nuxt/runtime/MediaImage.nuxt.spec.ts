import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MediaImage from '../../../layers/theme/app/components/global/Media/Image.vue'

describe('MediaImage (Nuxt runtime)', () => {
  it('avoids native auto-sizing for responsive wrapped images', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: {
        alt: 'Example',
        sizes: 'auto, (min-width: 768px) 33vw, 100vw',
        src: '/image.webp',
        srcset: '/image-320.webp 320w, /image-640.webp 640w',
      },
    })

    expect(wrapper.get('img').attributes('sizes')).toBe(
      '(min-width: 768px) 33vw, 100vw',
    )
  })

  it('preserves explicit sizes for bare images', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: {
        alt: 'Example',
        noWrapper: true,
        sizes: '(min-width: 768px) 50vw, 100vw',
        src: '/image.webp',
      },
    })

    expect(wrapper.get('img').attributes('sizes')).toBe(
      '(min-width: 768px) 50vw, 100vw',
    )
  })

  it('uses the viewport fallback when auto is the only wrapped size', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: {
        alt: 'Example',
        sizes: 'auto',
        src: '/image.webp',
      },
    })

    expect(wrapper.get('img').attributes('sizes')).toBe('100vw')
  })

  it('preserves image dimensions without exposing deferred sources', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: {
        alt: 'Deferred gallery image',
        deferSource: true,
        height: 800,
        src: '/image.webp',
        srcset: '/image-480.webp 480w, /image-640.webp 640w',
        width: 600,
      },
    })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('.media').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('.media').attributes('style')).toContain(
      'aspect-ratio: 600 / 800',
    )
  })
})
