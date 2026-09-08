import type { Component } from 'vue'
import { defineComponent, h, nextTick, onMounted } from 'vue'
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ParagraphReveal from '../../../layers/theme/app/components/ParagraphReveal.vue'
import ParagraphLayout from '../../../layers/theme/app/components/global/Paragraph/Layout.vue'

describe('static reveal content identity', () => {
  it.each<[string, Component, string]>([
    ['paragraph', ParagraphReveal, 'none'],
    ['animated paragraph', ParagraphReveal, 'fade-up'],
    ['layout', ParagraphLayout, 'none'],
    ['animated layout', ParagraphLayout, 'fade-up'],
  ])('keeps the %s child mounted once', async (_name, component, direction) => {
    let mounts = 0
    const Child = defineComponent({
      setup() {
        onMounted(() => { mounts++ })
        return () => h('input', { value: 'Preserved' })
      },
    })
    const wrapper = await mountSuspended(component, {
      props: { direction, animationScope: 'layout' },
      slots: { default: () => h(Child) },
    })

    await nextTick()
    expect(mounts).toBe(1)
    expect(wrapper.find('input').element.value).toBe('Preserved')
    wrapper.unmount()
  })
})
