import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { provideRevealMotionScope, useRevealMotionScope } from '../../../layers/theme/app/composables/useRevealMotionScope'

describe('reveal scope stagger indexes', () => {
  it('gives remounted content its place back instead of a later index', async () => {
    const indexes: number[] = []
    const Child = defineComponent({
      setup() {
        const { staggerIndex } = useRevealMotionScope(() => undefined)

        indexes.push(staggerIndex.value)
        return () => h('div')
      },
    })
    const showSecond = ref(true)
    const Scope = defineComponent({
      setup() {
        provideRevealMotionScope(() => 'fade-up', { stagger: true })
        return () => [h(Child), showSecond.value ? h(Child, { key: 'second' }) : null, h(Child)]
      },
    })
    const wrapper = await mountSuspended(Scope)

    expect(indexes).toEqual([0, 1, 2])

    showSecond.value = false
    await nextTick()
    showSecond.value = true
    await nextTick()

    expect(indexes.at(-1)).toBe(1)
    wrapper.unmount()
  })
})
