import { defineComponent, h } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useNuxtApp } from '#app'
import { useRevealMotionConfig } from '../../../layers/theme/app/composables/useRevealMotionConfig'

// What a reveal asks for on its very first render, before it mounts.
async function firstRender(): Promise<Record<string, unknown>> {
  let props: Record<string, unknown> = {}
  const Probe = defineComponent({
    setup() {
      props = useRevealMotionConfig().getRevealMotionProps('fade-up')
      return () => h('div')
    },
  })
  const wrapper = await mountSuspended(Probe)

  wrapper.unmount()
  return props
}

describe('reveal start state', () => {
  afterEach(() => {
    useNuxtApp().isHydrating = false
  })

  it('starts hidden when rendered on the client, as after a page change', async () => {
    const props = await firstRender()

    expect(props.initial).toMatchObject({ opacity: 0 })
    expect(props.style).toMatchObject({ opacity: 0 })
  })

  it('keeps server-rendered content visible while it hydrates', async () => {
    useNuxtApp().isHydrating = true
    const props = await firstRender()

    expect(props.initial).toBe(false)
    expect(props.style).not.toHaveProperty('opacity')
  })
})
