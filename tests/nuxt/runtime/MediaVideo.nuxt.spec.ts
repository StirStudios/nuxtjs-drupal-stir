import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MediaVideo from '../../../layers/theme/app/components/global/Media/Video.vue'

describe('MediaVideo (Nuxt runtime)', () => {
  it('renders a responsive hero poster without initial video bytes', async () => {
    const wrapper = await mountSuspended(MediaVideo, {
      props: {
        fetchpriority: 'high',
        height: 720,
        mediaEmbed: '/hero.mp4',
        noWrapper: true,
        sizes: '100vw',
        src: '/hero-poster.webp',
        srcset: '/hero-640.webp 640w, /hero-1280.webp 1280w',
        width: 1280,
      },
    })

    const video = wrapper.get('video')
    const poster = wrapper.get('img')

    expect(video.attributes('poster')).toBeUndefined()
    expect(video.attributes('preload')).toBe('none')
    expect(wrapper.find('source').exists()).toBe(false)
    expect(poster.attributes()).toMatchObject({
      fetchpriority: 'high',
      height: '720',
      sizes: '100vw',
      src: '/hero-poster.webp',
      srcset: '/hero-640.webp 640w, /hero-1280.webp 1280w',
      width: '1280',
    })
  })

  it('supports explicitly loading a bare video immediately', async () => {
    const load = vi
      .spyOn(HTMLMediaElement.prototype, 'load')
      .mockImplementation(() => {})
    const wrapper = await mountSuspended(MediaVideo, {
      props: {
        loadStrategy: 'immediate',
        loadMinWidth: 0,
        mediaEmbed: '/hero.mp4',
        noWrapper: true,
        src: '/hero-poster.webp',
      },
    })

    await nextTick()

    expect(wrapper.get('video').attributes('preload')).toBe('metadata')
    expect(wrapper.get('source').attributes('src')).toBe('/hero.mp4')
    expect(load).toHaveBeenCalledOnce()
    load.mockRestore()
  })

  it('renders a deferred remote hero as a muted background iframe', async () => {
    const wrapper = await mountSuspended(MediaVideo, {
      props: {
        loadStrategy: 'immediate',
        loadMinWidth: 0,
        mediaEmbed: 'https://www.youtube.com/embed/abcdefghijk',
        noWrapper: true,
        src: '/hero-poster.webp',
        title: 'Hero film',
      },
    })

    await nextTick()

    expect(wrapper.find('video').exists()).toBe(false)
    expect(wrapper.get('img').attributes('src')).toBe('/hero-poster.webp')
    const iframe = wrapper.get('iframe')
    const iframeSrc = iframe.attributes('src')

    expect(iframeSrc).toBeTruthy()
    const iframeUrl = new URL(iframeSrc || '')

    expect(iframe.attributes('tabindex')).toBe('-1')
    expect(iframe.attributes('title')).toBe('Hero film')
    expect(iframeUrl.searchParams.get('autoplay')).toBe('1')
    expect(iframeUrl.searchParams.get('mute')).toBe('1')
    expect(iframeUrl.searchParams.get('loop')).toBe('1')
  })

  it('does not load bare video below the configured viewport width', async () => {
    const matchMedia = vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList)
    const wrapper = await mountSuspended(MediaVideo, {
      props: {
        loadMinWidth: 768,
        mediaEmbed: '/hero.mp4',
        noWrapper: true,
        src: '/hero-poster.webp',
      },
    })

    await nextTick()

    expect(matchMedia).toHaveBeenCalledWith('(min-width: 768px)')
    expect(wrapper.find('source').exists()).toBe(false)
    expect(wrapper.get('video').attributes('preload')).toBe('none')
    matchMedia.mockRestore()
  })

  it('activates a deferred bare video when the viewport becomes eligible', async () => {
    let handleChange: ((event: MediaQueryListEvent) => void) | undefined
    const mediaQuery = {
      matches: false,
      addEventListener: vi.fn((event, handler) => {
        if (event === 'change') {
          handleChange = handler as (event: MediaQueryListEvent) => void
        }
      }),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList
    const matchMedia = vi.spyOn(window, 'matchMedia').mockImplementation(() => {
      return mediaQuery
    })
    const load = vi
      .spyOn(HTMLMediaElement.prototype, 'load')
      .mockImplementation(() => {})
    const wrapper = await mountSuspended(MediaVideo, {
      props: {
        loadMinWidth: 768,
        loadStrategy: 'immediate',
        mediaEmbed: '/hero.mp4',
        noWrapper: true,
        src: '/hero-poster.webp',
      },
    })

    Object.assign(mediaQuery, { matches: true })
    handleChange?.({ matches: true } as MediaQueryListEvent)
    await nextTick()

    expect(wrapper.get('source').attributes('src')).toBe('/hero.mp4')
    expect(load).toHaveBeenCalledOnce()
    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith(
      'change',
      handleChange,
    )
    load.mockRestore()
    matchMedia.mockRestore()
  })

  it('defers animated previews until hover and restores responsive thumbnails', async () => {
    const wrapper = await mountSuspended(MediaVideo, {
      props: {
        animatedPreviewSrc: '/animated-preview.webp',
        height: 360,
        previewMode: 'animated',
        sizes: '(min-width: 768px) 33vw, 100vw',
        src: '/static-preview.webp',
        srcset: '/static-320.webp 320w, /static-640.webp 640w',
        width: 640,
      },
    })
    const button = wrapper.get('button')

    expect(button.get('img').attributes()).toMatchObject({
      height: '360',
      loading: 'lazy',
      sizes: '(min-width: 768px) 33vw, 100vw',
      src: '/static-preview.webp',
      srcset: '/static-320.webp 320w, /static-640.webp 640w',
      width: '640',
    })

    await button.trigger('mouseenter')

    expect(button.get('img').attributes('src')).toBe('/animated-preview.webp')
    expect(button.get('img').attributes('srcset')).toBeUndefined()

    await button.trigger('mouseleave')

    expect(button.get('img').attributes('src')).toBe('/static-preview.webp')
    expect(button.get('img').attributes('srcset')).toBe(
      '/static-320.webp 320w, /static-640.webp 640w',
    )
  })
})
