import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MediaVideo from '../../../layers/theme/app/components/global/Media/Video.vue'

describe('MediaVideo (Nuxt runtime)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('pauses and resumes a direct background video with viewport visibility', async () => {
    const observers: Array<{
      callback: IntersectionObserverCallback
      targets: Element[]
    }> = []

    vi.stubGlobal(
      'IntersectionObserver',
      class {
        private readonly record: {
          callback: IntersectionObserverCallback
          targets: Element[]
        }

        constructor(callback: IntersectionObserverCallback) {
          this.record = { callback, targets: [] }
          observers.push(this.record)
        }

        disconnect() {}
        observe(target: Element) { this.record.targets.push(target) }
        takeRecords() { return [] }
        unobserve() {}
      },
    )
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue()
    const pause = vi
      .spyOn(HTMLMediaElement.prototype, 'pause')
      .mockImplementation(() => {})

    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})

    const wrapper = await mountSuspended(MediaVideo, {
      props: {
        loadStrategy: 'immediate',
        loadMinWidth: 0,
        mediaEmbed: '/hero.mp4',
        noWrapper: true,
      },
    })

    await nextTick()

    const video = wrapper.get('video').element
    const videoObserver = observers.find(observer => observer.targets.includes(video))
    const entry = (isIntersecting: boolean, time: number) => ({
      isIntersecting,
      target: video,
      time,
    }) as unknown as IntersectionObserverEntry

    expect(videoObserver).toBeDefined()
    videoObserver!.callback(
      [entry(false, 1)],
      {} as IntersectionObserver,
    )
    await vi.waitFor(() => expect(pause).toHaveBeenCalled())

    videoObserver!.callback(
      [entry(true, 2)],
      {} as IntersectionObserver,
    )
    await vi.waitFor(() => expect(play).toHaveBeenCalled())
  })

  it('uses Nuxt Image for a versioned static video poster', async () => {
    const wrapper = await mountSuspended(MediaVideo, {
      props: {
        height: 1080,
        mediaEmbed: 'https://player.example/embed/video',
        originalRevision: '42-1710000000-123456',
        originalSrc: 'https://drupal.example/files/poster.jpg',
        deliveryProfile: 'card',
        src: 'https://drupal.example/styles/card/poster.webp',
        width: 1920,
      },
    })

    const poster = wrapper.get('button img')

    expect(poster.attributes('data-nuxt-img')).toBeDefined()
    expect(poster.attributes('src')).toContain(
      'poster.jpg?v=42-1710000000-123456',
    )
    expect(poster.attributes('srcset')).toContain(
      'poster.jpg?v=42-1710000000-123456',
    )
    expect(poster.attributes('srcset')).not.toContain('/styles/card/')
  })

  it('renders a responsive hero poster without initial video bytes', async () => {
    const wrapper = await mountSuspended(MediaVideo, {
      props: {
        fetchpriority: 'high',
        height: 720,
        mediaEmbed: '/hero.mp4',
        noWrapper: true,
        deliverySizes: '100vw',
        src: '/hero-poster.webp',
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
      width: '1280',
    })
    expect(poster.attributes('src')).toContain('/hero-poster.webp')
    expect(poster.attributes('srcset')).toContain('/hero-poster.webp')
  })

  it('honors the explicit hero context passed through a Drupal media slot', async () => {
    const wrapper = await mountSuspended(MediaVideo, {
      props: {
        isHero: true,
        mediaEmbed: '/hero.mp4',
        src: '/hero-poster.webp',
        title: 'Background Video',
      },
    })

    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.get('video').attributes()).toMatchObject({
      'aria-hidden': 'true',
      'disablepictureinpicture': '',
      'disableremoteplayback': '',
      'tabindex': '-1',
    })
    expect(wrapper.get('img').attributes('aria-hidden')).toBe('true')
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

  it('plays a Drupal local-video src without treating the MP4 as a poster', async () => {
    const wrapper = await mountSuspended(MediaVideo, {
      props: {
        src: '/media/example.mp4',
        title: 'Example local video',
      },
    })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('video').exists()).toBe(false)

    await wrapper.get('button').trigger('click')

    expect(wrapper.get('video').attributes('controls')).toBeDefined()
    expect(wrapper.get('source').attributes('src')).toBe('/media/example.mp4')
  })

  it('uses a Drupal local-video src directly for bare hero video', async () => {
    const load = vi
      .spyOn(HTMLMediaElement.prototype, 'load')
      .mockImplementation(() => {})
    const wrapper = await mountSuspended(MediaVideo, {
      props: {
        loadMinWidth: 0,
        loadStrategy: 'immediate',
        noWrapper: true,
        src: '/media/background.mp4',
      },
    })

    await nextTick()

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('source').attributes('src')).toBe('/media/background.mp4')
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
    expect(wrapper.get('img').attributes('src')).toContain('/hero-poster.webp')
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

  it('renders a signed Bunny player URL as an iframe', async () => {
    const embed = 'https://player.mediadelivery.net/embed/348346/video-id?responsive=true&token=signed-token&expires=1784223559'
    const wrapper = await mountSuspended(MediaVideo, {
      props: {
        deferEmbed: false,
        mediaEmbed: embed,
        mid: 'video-id',
        title: 'Subscriber class',
      },
    })

    await nextTick()

    expect(wrapper.find('video').exists()).toBe(false)
    expect(wrapper.get('iframe').attributes()).toMatchObject({
      'data-mid': 'video-id',
      'src': embed,
      'title': 'Subscriber class',
    })
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
        deliverySizes: '100vw md:33vw',
        src: '/static-preview.webp',
        width: 640,
      },
    })
    const button = wrapper.get('button')

    expect(button.get('img').attributes()).toMatchObject({
      height: '360',
      loading: 'lazy',
      sizes: '(max-width: 768px) 100vw, 33vw',
      width: '640',
    })
    expect(button.get('img').attributes('src')).toContain('/static-preview.webp')
    expect(button.get('img').attributes('srcset')).toContain('/static-preview.webp')

    await button.trigger('mouseenter')

    expect(button.get('img').attributes('src')).toContain('/animated-preview.webp')
    expect(button.get('img').attributes('srcset')).toContain('/animated-preview.webp')

    await button.trigger('mouseleave')

    expect(button.get('img').attributes('src')).toContain('/static-preview.webp')
    expect(button.get('img').attributes('srcset')).toContain('/static-preview.webp')
  })

  it('renders animated MP4 previews as deferred muted video', async () => {
    const wrapper = await mountSuspended(MediaVideo, {
      props: {
        animatedPreviewSrc: '/animated-preview.mp4',
        previewMode: 'animated',
        src: '/static-preview.webp',
      },
    })
    const button = wrapper.get('button')

    expect(button.find('video').exists()).toBe(false)
    expect(button.get('img').attributes('src')).toContain('/static-preview.webp')

    await button.trigger('mouseenter')

    expect(button.find('img').exists()).toBe(false)
    expect(button.get('video').attributes()).toMatchObject({
      autoplay: '',
      loop: '',
      muted: '',
      playsinline: '',
      preload: 'none',
    })
    expect(button.get('source').attributes()).toMatchObject({
      src: '/animated-preview.mp4',
      type: 'video/mp4',
    })

    await button.trigger('mouseleave')

    expect(button.find('video').exists()).toBe(false)
    expect(button.get('img').attributes('src')).toContain('/static-preview.webp')
  })

  it('preserves the declared aspect ratio inside stretching layouts', async () => {
    const wrapper = await mountSuspended(MediaVideo, {
      props: {
        height: 1080,
        mediaEmbed: 'https://example.com/embed/video',
        src: '/static-preview.webp',
        width: 1920,
      },
    })

    expect(wrapper.get('div').classes()).toContain('aspect-[16/9]')
    expect(wrapper.get('div').attributes('style')).toContain(
      'aspect-ratio: 1920 / 1080; height: auto;',
    )
  })

  it('uses the standard embed canvas instead of cinematic poster dimensions', async () => {
    const wrapper = await mountSuspended(MediaVideo, {
      props: {
        height: 816,
        mediaEmbed: 'https://player.mediadelivery.net/embed/library/video',
        src: '/cinematic-preview.webp',
        width: 1920,
      },
    })

    expect(wrapper.get('div').classes()).toContain('aspect-[16/9]')
    expect(wrapper.get('div').attributes('style')).toContain(
      'aspect-ratio: 16 / 9; height: auto;',
    )
  })

  it('does not forward modal-only media metadata to the wrapper element', async () => {
    const wrapper = await mountSuspended(MediaVideo, {
      props: {
        mediaEmbed: 'https://player.mediadelivery.net/embed/library/video',
        modalResponsiveStyle: 'container',
        modalSizes: '100vw',
        modalSrc: '/modal.webp',
        modalSrcset: '/modal.webp 1200w',
        src: '/preview.webp',
        type: 'video',
      },
    })

    const attributes = wrapper.get('div').attributes()

    expect(attributes.type).toBeUndefined()
    expect(attributes.modalsrc).toBeUndefined()
    expect(attributes.modalsrcset).toBeUndefined()
    expect(attributes.modalsizes).toBeUndefined()
    expect(attributes.modalresponsivestyle).toBeUndefined()
  })
})
