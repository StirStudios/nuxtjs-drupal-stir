import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import RevealMotionElement from '../../../layers/theme/app/components/RevealMotionElement.vue'
import { useRevealMotionConfig } from '../../../layers/theme/app/composables/useRevealMotionConfig'

describe('RevealMotionElement shorthand', () => {
  it('applies per-call duration, distance and viewport margin overrides', async () => {
    let motionProps: Record<string, unknown> = {}
    const Probe = defineComponent({
      setup() {
        const { getRevealMotionProps } = useRevealMotionConfig()

        return () => {
          motionProps = getRevealMotionProps('fade-left', 80, {
            durationMs: 600,
            distancePx: 12,
            rootMargin: '0px 0px -18% 0px',
          })
          return h('div')
        }
      },
    })
    const wrapper = await mountSuspended(Probe)

    await wrapper.vm.$forceUpdate()
    expect(motionProps.transition).toMatchObject({ duration: 0.6, delay: 0.08 })
    expect(motionProps.initial).toMatchObject({ opacity: 0, x: -12 })
    expect(motionProps.inViewOptions).toMatchObject({ margin: '0px 0px -18% 0px' })
    wrapper.unmount()
  })

  it('renders the requested element with attributes and slot content', async () => {
    const wrapper = await mountSuspended(RevealMotionElement, {
      props: { as: 'h2', effect: 'fade-up', durationMs: 600, distancePx: 24 },
      attrs: { class: 'section-title' },
      slots: { default: () => 'Selected work' },
    })

    expect(wrapper.get('h2.section-title').text()).toBe('Selected work')
    wrapper.unmount()
  })

  it('renders plain content without an effect', async () => {
    const wrapper = await mountSuspended(RevealMotionElement, {
      props: { as: 'p' },
      slots: { default: () => 'Static' },
    })

    expect(wrapper.get('p').text()).toBe('Static')
    expect(wrapper.get('p').attributes('style')).toBeUndefined()
    wrapper.unmount()
  })
})
