import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import ParagraphButton from '../../../layers/theme/app/components/global/Paragraph/Button.vue'
import ParagraphView from '../../../layers/theme/app/components/global/Paragraph/View.vue'
import { provideRevealMotionScope } from '../../../layers/theme/app/composables/useRevealMotionScope'

const PageRevealScope = defineComponent({
  props: {
    component: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    provideRevealMotionScope(() => 'fade-up', { stagger: true })

    return () => h(props.component, {
      id: 'revealed',
      link: {
        title: 'Purchase',
        url: '/purchase',
      },
    }, {
      content: () => h('div', { class: 'view-content' }, 'View content'),
    })
  },
})

describe('paragraph reveal targets (Nuxt runtime)', () => {
  it('applies inherited page reveal motion to button paragraphs', async () => {
    const wrapper = await mountSuspended(PageRevealScope, {
      props: { component: ParagraphButton },
    })

    expect(wrapper.find('a[href="/purchase"]').exists()).toBe(true)
    expect(wrapper.find('[style*="opacity"]').exists()).toBe(true)
  })

  it('applies inherited page reveal motion to view paragraphs', async () => {
    const wrapper = await mountSuspended(PageRevealScope, {
      props: { component: ParagraphView },
    })

    expect(wrapper.find('.view-content').exists()).toBe(true)
    expect(wrapper.find('[style*="opacity"]').exists()).toBe(true)
  })
})
