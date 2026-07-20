import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MediaImage from '../../../layers/theme/app/components/global/Media/Image.vue'
import { carouselImageDeliverySizesKey } from '../../../layers/theme/app/utils/imageDelivery'

describe('MediaImage (Nuxt runtime)', () => {
  it('accepts a canonical provider source without leaking it into markup', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: {
        alt: 'Example image',
        noWrapper: true,
        originalRevision: '42-1710000000-293400',
        originalSrc: '/media/original.jpg',
        src: '/styles/card/example.webp',
      },
    })

    expect(wrapper.get('img').attributes('src')).toContain(
      '/media/original.jpg?v=42-1710000000-293400',
    )
    expect(wrapper.get('img').attributes('src')).not.toContain('/styles/card/')
    expect(wrapper.get('img').attributes('originalrevision')).toBeUndefined()
    expect(wrapper.get('img').attributes('originalsrc')).toBeUndefined()
  })

  it('uses the versioned original through Nuxt Image', async () => {
    const wrapper = await mountSuspended(MediaImage, {
        props: {
          alt: 'Provider image',
          height: 900,
          noWrapper: true,
          originalRevision: '42-1710000000-293400',
          originalSrc: 'https://drupal.example/files/image.jpg?download=1',
          deliveryProfile: 'card',
          src: '/styles/card/image.webp',
          srcset: '/styles/640/image.webp 640w',
          width: 1600,
        },
    })

    expect(wrapper.get('img').attributes()).toMatchObject({
        'data-nuxt-img': '',
        'sizes': '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 400px',
        src: 'https://drupal.example/files/image.jpg?download=1&v=42-1710000000-293400',
      })
    expect(wrapper.get('img').attributes('srcset')).toContain(
        'https://drupal.example/files/image.jpg?download=1&v=42-1710000000-293400',
      )
    expect(wrapper.get('img').attributes('srcset')).not.toContain('/styles/')
  })

  it('optimizes media without canonical metadata from its rendered source', async () => {
    const wrapper = await mountSuspended(MediaImage, {
        props: {
          alt: 'Instagram image',
          platform: 'instagram',
          deliveryProfile: 'card',
          src: 'https://drupal.example/styles/1024/instagram.webp',
          srcset: 'https://drupal.example/styles/640/instagram.webp 640w',
        },
    })

    expect(wrapper.get('img').attributes('data-nuxt-img')).toBe('')
    expect(wrapper.get('img').attributes('srcset')).not.toContain('styles/640')
    expect(wrapper.get('img').attributes('srcset')).toContain('styles/1024')
  })

  it('falls back to the container profile when a profile is unknown', async () => {
      const wrapper = await mountSuspended(MediaImage, {
        props: {
          alt: 'Fallback image',
          noWrapper: true,
          originalRevision: '42-1710000000-293400',
          originalSrc: 'https://drupal.example/files/image.jpg',
          deliveryProfile: 'project-specific',
          src: '/styles/project/image.webp',
          srcset: '/styles/640/image.webp 640w',
        },
      })

      expect(wrapper.get('img').attributes('data-nuxt-img')).toBe('')
      expect(wrapper.get('img').attributes('src')).toContain(
        'image.jpg?v=42-1710000000-293400',
      )
      expect(wrapper.get('img').attributes('sizes')).toBe(
        '(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px',
      )
  })

  it('allows a layout to narrow Nuxt Image sizes without changing Drupal sizes', async () => {
    const wrapper = await mountSuspended(MediaImage, {
        props: {
          alt: 'Compact card',
          deliverySizes: '210px sm:270px md:330px',
          noWrapper: true,
          originalRevision: '42-1710000000-293400',
          originalSrc: 'https://drupal.example/files/image.jpg',
          deliveryProfile: 'card',
          sizes: '(max-width: 639px) 210px, (max-width: 767px) 270px, 330px',
          src: '/styles/card/image.webp',
        },
    })

    expect(wrapper.get('img').attributes('sizes')).toBe(
        '(max-width: 640px) 210px, (max-width: 768px) 270px, 330px',
      )
  })

  it('uses a full-width carousel profile instead of a nested card profile', async () => {
    const wrapper = await mountSuspended(MediaImage, {
        global: {
          provide: {
            [carouselImageDeliverySizesKey as symbol]: computed(() =>
              'sm:100vw md:100vw lg:100vw xl:100vw 2xl:100vw',
            ),
          },
        },
        props: {
          alt: 'Full-width carousel image',
          noWrapper: true,
          originalSrc: 'https://drupal.example/files/image.jpg',
          deliveryProfile: 'card',
          src: '/styles/card/image.webp',
        },
    })

    expect(wrapper.get('img').attributes('sizes')).toBe(
        '(max-width: 768px) 100vw, (max-width: 1024px) 100vw, (max-width: 1280px) 100vw, (max-width: 1536px) 100vw, 100vw',
      )
    expect(wrapper.get('img').attributes('srcset')).toContain('3072')
  })

  it('avoids native auto-sizing for responsive wrapped images', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: {
        alt: 'Example',
        deliverySizes: '100vw md:33vw',
        src: '/image.webp',
        srcset: '/image-320.webp 320w, /image-640.webp 640w',
      },
    })

    expect(wrapper.get('img').attributes('sizes')).toBe(
      '(max-width: 768px) 100vw, 33vw',
    )
  })

  it('preserves explicit sizes for bare images', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: {
        alt: 'Example',
        noWrapper: true,
        deliverySizes: '100vw md:50vw',
        src: '/image.webp',
      },
    })

    expect(wrapper.get('img').attributes('sizes')).toBe(
      '(max-width: 768px) 100vw, 50vw',
    )
  })

  it('uses the bare image as its loading placeholder without another wrapper', async () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get')
      .mockReturnValue(false)

    try {
      const wrapper = await mountSuspended(MediaImage, {
        props: {
          alt: 'Example image',
          noWrapper: true,
          src: '/image.webp',
        },
      })
      const image = wrapper.get('img')

      expect(wrapper.element.tagName).toBe('IMG')
      expect(image.classes()).toEqual(expect.arrayContaining([
        'bg-elevated',
        'text-transparent',
        'motion-safe:animate-pulse',
      ]))

      await image.trigger('load')

      expect(image.classes()).not.toContain('bg-elevated')
      expect(image.classes()).not.toContain('text-transparent')
      expect(image.classes()).not.toContain('motion-safe:animate-pulse')
    }
    finally {
      complete.mockRestore()
    }
  })

  it('uses the container profile when no delivery profile is provided', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: {
        alt: 'Example',
        src: '/image.webp',
      },
    })

    expect(wrapper.get('img').attributes('sizes')).toBe(
      '(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px',
    )
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
