import { computed, defineComponent, h } from 'vue'
import { UApp } from '#components'
import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MediaImage from '../../../layers/theme/app/components/global/Media/Image.vue'
import { imageSlotKey, sectionHeroMediaKey, viewportImageLoadingKey } from '../../../layers/theme/app/utils/imageDelivery'

const CONTAINER_SIZES = 'auto, (max-width: 767px) calc(100vw - 32px), (max-width: 1023px) calc(100vw - 40px), (max-width: 1535px) calc(100vw - 64px), 1472px'

describe('MediaImage (Nuxt runtime)', () => {
  it('reports the cached responsive source without waiting for another load event', async () => {
    const source = 'https://images.example/cached-640.webp'
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
    const width = vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(640)
    const currentSrc = vi.spyOn(HTMLImageElement.prototype, 'currentSrc', 'get').mockReturnValue(source)

    try {
      const wrapper = await mountSuspended(MediaImage, {
        props: { src: '/poster.jpg', noWrapper: true },
      })

      expect(wrapper.emitted('resolved-src')).toContainEqual([source])
      wrapper.unmount()
    }
    finally {
      complete.mockRestore()
      width.mockRestore()
      currentSrc.mockRestore()
    }
  })

  it('shows a re-rendered image this browser already loaded without fading it in again', async () => {
    // Keep images "loading" so only the load event marks them loaded.
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(false)
    const faded = (wrapper: Awaited<ReturnType<typeof mountSuspended>>) =>
      wrapper.get('img').classes().includes('opacity-0')

    try {
      const first = await mountSuspended(MediaImage, { props: { src: '/nav-tile-loaded.jpg' } })

      expect(faded(first)).toBe(true)
      await first.get('img').trigger('load')
      expect(faded(first)).toBe(false)
      first.unmount()

      const again = await mountSuspended(MediaImage, { props: { src: '/nav-tile-loaded.jpg' } })

      expect(faded(again)).toBe(false)
      again.unmount()

      const unseen = await mountSuspended(MediaImage, { props: { src: '/nav-tile-unseen.jpg' } })

      expect(faded(unseen)).toBe(true)
      unseen.unmount()
    }
    finally {
      complete.mockRestore()
    }
  })

  it.each([false, true])('uses native viewport loading for reused media (bare: %s)', async (noWrapper) => {
    const wrapper = await mountSuspended(MediaImage, {
      global: { provide: { [viewportImageLoadingKey as symbol]: true } },
      props: { src: '/hero.jpg', loading: 'eager', fetchpriority: 'high', noWrapper },
    })

    expect(wrapper.get('img').attributes()).toMatchObject({ loading: 'lazy', fetchpriority: 'auto' })
    expect(wrapper.findAll('img')).toHaveLength(1)
    expect(wrapper.findAll('.media')).toHaveLength(noWrapper ? 0 : 1)
    wrapper.unmount()
  })

  it('does not treat a source hero flag as priority for every carousel slide', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      global: { provide: { [viewportImageLoadingKey as symbol]: true } },
      props: { src: '/hero.jpg', isHero: true, loading: 'eager', fetchpriority: 'high' },
    })

    expect(wrapper.get('img').attributes()).toMatchObject({ loading: 'lazy', fetchpriority: 'auto' })
    expect(wrapper.find('.media').exists()).toBe(false)
    wrapper.unmount()
  })

  it('covers a section hero with its background image', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      global: { provide: { [sectionHeroMediaKey as symbol]: computed(() => true) } },
      props: { src: '/hero.jpg', isHero: true },
    })
    const classes = wrapper.get('img').classes()

    expect(classes).toEqual(expect.arrayContaining(['absolute', 'inset-0', 'size-full', 'object-cover']))
    expect(classes).not.toContain('w-auto')
    wrapper.unmount()
  })

  it('keeps page hero image sizing outside a section hero', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: { src: '/hero.jpg', isHero: true },
    })

    expect(wrapper.get('img').classes()).toEqual(expect.arrayContaining(['w-auto', 'min-w-full']))
    wrapper.unmount()
  })

  it('preserves priority for a real page hero outside a viewport-loading region', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: { src: '/hero.jpg', isHero: true, loading: 'eager', fetchpriority: 'high' },
    })

    expect(wrapper.get('img').attributes()).toMatchObject({ loading: 'eager', fetchpriority: 'high' })
    wrapper.unmount()
  })

  it.each(['auto', 'low'] as const)('honors explicit %s priority for an eager wrapped image', async (fetchpriority) => {
    const wrapper = await mountSuspended(MediaImage, {
      props: { src: '/image.jpg', loading: 'eager', fetchpriority },
    })

    expect(wrapper.get('img').attributes()).toMatchObject({ loading: 'eager', fetchpriority })
    wrapper.unmount()
  })

  it('renders linked Instagram media as one interactive link', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: { src: '/instagram.webp', alt: 'Studio project', platform: 'instagram', link: 'https://www.instagram.com/p/example/' },
    })

    expect(wrapper.findAll('a')).toHaveLength(1)
    expect(wrapper.find('a a, a button').exists()).toBe(false)
    expect(wrapper.get('a').attributes('href')).toBe('https://www.instagram.com/p/example/')
    wrapper.unmount()
  })

  it('keeps edit controls outside the image link', async () => {
    const wrapper = await mountSuspended(defineComponent({
      setup: () => () => h(UApp, {}, { default: () => h(MediaImage, {
        src: '/image.webp', alt: 'Project', link: 'https://example.com/project',
        editActions: [{ key: 'full', tooltip: 'Edit', ariaLabel: 'Edit image', icon: 'i-lucide-square-pen', variant: 'soft', buttonClass: '', to: '/edit' }],
      }) }),
    }))

    await vi.waitFor(() => expect(wrapper.find('[aria-label="Edit image"]').exists()).toBe(true))
    expect(wrapper.get('.media').element.tagName).toBe('DIV')
    expect(wrapper.find('a a, a button').exists()).toBe(false)
    expect(wrapper.get('a[aria-label="Project"]').attributes('href')).toBe('https://example.com/project')
    wrapper.unmount()
  })

  it('allows a contextual square-corner override', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: {
        alt: 'Full-width image',
        roundedClass: 'rounded-none',
        src: '/image.webp',
      },
    })

    expect(wrapper.get('.media').classes()).toContain('rounded-none')
    expect(wrapper.get('img').classes()).toContain('rounded-none')
  })

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

  it('uses the versioned original through the image provider', async () => {
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
        sizes: CONTAINER_SIZES,
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

    expect(wrapper.get('img').attributes('srcset')).not.toContain('styles/640')
    expect(wrapper.get('img').attributes('srcset')).toContain('styles/1024')
  })

  it('ignores a legacy Drupal delivery profile and keeps it off the markup', async () => {
      const wrapper = await mountSuspended(MediaImage, {
        props: {
          alt: 'Fallback image',
          noWrapper: true,
          originalRevision: '42-1710000000-293400',
          originalSrc: 'https://drupal.example/files/image.jpg',
          deliveryProfile: 'full',
          src: '/styles/project/image.webp',
          srcset: '/styles/640/image.webp 640w',
        },
      })

      expect(wrapper.get('img').attributes('src')).toContain(
        'image.jpg?v=42-1710000000-293400',
      )
      expect(wrapper.get('img').attributes('sizes')).toBe(CONTAINER_SIZES)
      expect(wrapper.get('img').attributes('deliveryprofile')).toBeUndefined()
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
        '(max-width: 639px) 210px, (max-width: 767px) 270px, 330px',
      )
  })

  it('sizes an edge-to-edge image, or the slot its layout provides, to that width', async () => {
    const full = await mountSuspended(MediaImage, {
      global: {
        provide: { [imageSlotKey as symbol]: computed(() => (viewport: number) => viewport) },
      },
      props: {
        alt: 'Edge-to-edge image',
        noWrapper: true,
        originalSrc: 'https://drupal.example/files/image.jpg',
        src: '/styles/card/image.webp',
      },
    })

    expect(full.get('img').attributes('sizes')).toBe('auto, 100vw')
    // Without a known source width the srcset is the whole width ladder.
    expect(full.get('img').attributes('srcset')).toContain(' 3840w')

    const column = await mountSuspended(MediaImage, {
      global: {
        provide: { [imageSlotKey as symbol]: computed(() => (viewport: number) => viewport / 2) },
      },
      props: { alt: 'Half-width image', noWrapper: true, src: '/image.webp' },
    })

    expect(column.get('img').attributes('sizes')).toBe('auto, 50vw')
  })

  it('keeps a fixed sizes value and builds srcset from the width ladder, capped at the source', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: {
        alt: 'Portrait photo',
        deliverySizes: '640px',
        height: 1500,
        noWrapper: true,
        originalSrc: 'https://drupal.example/files/portrait.jpg',
        src: '/styles/card/portrait.webp',
        width: 1000,
      },
    })
    const srcset = wrapper.get('img').attributes('srcset') ?? ''

    expect(wrapper.get('img').attributes('sizes')).toBe('640px')
    expect(srcset.split(', ').map(entry => entry.split(' ').at(-1)))
      .toEqual(['64w', '128w', '256w', '320w', '480w', '640w', '750w', '828w', '1000w'])
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
      '(max-width: 767px) 100vw, 33vw',
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
      '(max-width: 767px) 100vw, 50vw',
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

  it('does not let a cover-cropped image use sizes="auto", which would size it to its box', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: {
        alt: 'Panorama',
        height: 772,
        mediaHeight: 'break',
        src: '/panorama.webp',
        width: 4000,
      },
    })
    const sizes = wrapper.get('img').attributes('sizes') ?? ''

    expect(sizes.startsWith('auto')).toBe(false)
    expect(sizes).toContain('1659px')
    // It is wider than its box, so each band gets a crop to the box's shape.
    expect(wrapper.find('.media > picture > img').exists()).toBe(true)
    expect(wrapper.findAll('picture > source').length).toBeGreaterThan(0)
  })

  it('leaves an image no wider than its box out of <picture>', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: { alt: 'Square', height: 1000, mediaHeight: 'break', src: '/square.webp', width: 1000 },
    })

    expect(wrapper.find('picture').exists()).toBe(false)
    expect(wrapper.find('.media > img').exists()).toBe(true)
  })

  it('asks for about 1x of a hero on high-density screens only', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: { alt: 'Hero', height: 3000, isHero: true, src: '/hero.webp', width: 5000 },
    })
    const sizes = wrapper.get('img').attributes('sizes') ?? ''

    expect(sizes.startsWith('(min-resolution: 1.5dppx) and (max-width: ')).toBe(true)
    expect(sizes).toContain(', (max-width: ')
  })

  it('sizes to the theme container without a layout slot', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: {
        alt: 'Example',
        src: '/image.webp',
      },
    })

    expect(wrapper.get('img').attributes('sizes')).toBe(CONTAINER_SIZES)
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

  it('keeps visual image placeholders out of the accessibility tree', async () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get')
      .mockReturnValue(false)

    try {
      const wrapper = await mountSuspended(MediaImage, {
        props: {
          alt: 'Example image',
          // Loaded images are remembered, so use a source no other test loads.
          src: '/placeholder-a11y.webp',
        },
      })

      expect(wrapper.get('[aria-hidden="true"]').classes()).toContain('animate-pulse')
      expect(wrapper.get('[aria-hidden="true"]').attributes('role')).toBe('presentation')
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    }
    finally {
      complete.mockRestore()
    }
  })
})
