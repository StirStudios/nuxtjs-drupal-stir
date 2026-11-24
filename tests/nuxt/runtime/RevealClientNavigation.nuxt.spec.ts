import { h } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useNuxtApp } from '#app'
import RevealMotion from '../../../layers/theme/app/components/RevealMotion.vue'
import type { RevealPlay } from '../../../layers/theme/app/components/RevealMotion.vue'
import { useRevealMotionConfig } from '../../../layers/theme/app/composables/useRevealMotionConfig'

function preferReducedMotion() {
  return vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as MediaQueryList,
  )
}

// The inline style a fade-up reveal has once it is drawn.
async function revealStyle(play: RevealPlay = 'inView'): Promise<string> {
  const wrapper = await mountSuspended({
    setup() {
      const motionProps = useRevealMotionConfig().getRevealMotionProps('fade-up')

      return () => h(RevealMotion, { ...motionProps, play }, () => 'Content')
    },
  })
  // Left mounted: unmounting mid-entrance cancels the animation, which rejects.
  return wrapper.get('.reveal-motion').attributes('style') ?? ''
}

describe('reveal start state', () => {
  afterEach(() => {
    useNuxtApp().isHydrating = false
    vi.restoreAllMocks()
  })

  it('describes the animation only, whatever the load path', async () => {
    useNuxtApp().isHydrating = true
    const wrapper = await mountSuspended({
      setup() {
        const props = useRevealMotionConfig().getRevealMotionProps('fade-up')

        expect(props.initial).toMatchObject({ opacity: 0 })
        expect(props).not.toHaveProperty('style')
        return () => h('div')
      },
    })

    wrapper.unmount()
  })

  it('starts hidden when drawn in the browser, as after a page change', async () => {
    expect(await revealStyle()).toContain('opacity: 0')
  })

  it('never hides content drawn in the browser when reduced motion is requested', async () => {
    preferReducedMotion()
    expect(await revealStyle()).not.toContain('opacity: 0')
  })

  it('keeps server-rendered content as rendered while it hydrates', async () => {
    useNuxtApp().isHydrating = true
    expect(await revealStyle()).not.toContain('opacity: 0')
  })

  it('starts a load entrance hidden, server HTML included', async () => {
    useNuxtApp().isHydrating = true
    expect(await revealStyle('load')).toContain('opacity: 0')
  })
})
