import type { SlotsToolkit } from '../../../layers/theme/app/composables/useSlotsToolkit'
import { h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MediaItem from '../../../layers/theme/app/components/global/Media/Item.vue'

describe('MediaItem (Nuxt runtime)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
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
})
