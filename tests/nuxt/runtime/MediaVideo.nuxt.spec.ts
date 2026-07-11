import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MediaVideo from '../../../layers/theme/app/components/global/Media/Video.vue'

describe('MediaVideo (Nuxt runtime)', () => {
  it('keeps bare video bytes out of the initial render', async () => {
    const wrapper = await mountSuspended(MediaVideo, {
      props: {
        mediaEmbed: '/hero.mp4',
        noWrapper: true,
        src: '/hero-poster.webp',
      },
    })

    const video = wrapper.get('video')

    expect(video.attributes('poster')).toBe('/hero-poster.webp')
    expect(video.attributes('preload')).toBe('none')
    expect(wrapper.find('source').exists()).toBe(false)
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
})
