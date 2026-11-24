import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import ParagraphView from '../../../layers/theme/app/components/global/Paragraph/View.vue'
import { provideRevealMotionScope, useRevealMotionScope } from '../../../layers/theme/app/composables/useRevealMotionScope'

// What a View's rows resolve: DrupalViewDisplay calls useRevealMotionScope
// with the inner View element's own direction, which Drupal never sends.
const RowsProbe = defineComponent({
  setup() {
    const { effect } = useRevealMotionScope(() => undefined)

    return () => h('p', { id: 'effect' }, effect.value || 'none')
  },
})

const mountView = (direction?: string, pageEffect?: string) => mountSuspended(defineComponent({
  setup() {
    if (pageEffect) provideRevealMotionScope(() => pageEffect)

    return () => h(ParagraphView, { id: 1, direction }, { content: () => h(RowsProbe) })
  },
}))

describe('View paragraph Animation', () => {
  it('gives its rows the Animation an editor sets on the paragraph', async () => {
    const wrapper = await mountView('fade-up')

    expect(wrapper.get('#effect').text()).toBe('fade-up')
  })

  it('wins over the page animation for its own rows', async () => {
    const wrapper = await mountView('zoom-in', 'fade-up')

    expect(wrapper.get('#effect').text()).toBe('zoom-in')
  })

  it('leaves its rows on the page animation when none is set', async () => {
    const wrapper = await mountView(undefined, 'fade-up')

    expect(wrapper.get('#effect').text()).toBe('fade-up')
  })
})
