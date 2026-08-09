import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, inject } from 'vue'
import ParagraphView from '../../../layers/theme/app/components/global/Paragraph/View.vue'
import { drupalViewQueryNamespaceKey } from '../../../layers/theme/app/utils/drupalViewContext'

const QueryNamespaceProbe = defineComponent({
  setup() {
    const queryNamespace = inject(drupalViewQueryNamespaceKey, undefined)

    return () => h('span', {
      class: 'query-namespace-probe',
      'data-query-namespace': queryNamespace?.value,
    })
  },
})

describe('ParagraphView (Nuxt runtime)', () => {
  it('provides its query namespace to the rendered Drupal view', async () => {
    const wrapper = await mountSuspended(ParagraphView, {
      props: {
        queryNamespace: ' articles ',
      },
      slots: {
        content: () => h(QueryNamespaceProbe),
      },
    })

    expect(wrapper.get('.query-namespace-probe').attributes('data-query-namespace'))
      .toBe('articles')
  })
})
