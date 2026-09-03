import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, inject } from 'vue'
import { renderToString } from 'vue/server-renderer'
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

  it('derives the same stable namespace from Drupal paragraph identity', async () => {
    const wrapper = await mountSuspended(ParagraphView, {
      props: {
        uuid: 'A0B1-C2D3',
        viewId: 'Work',
      },
      slots: {
        content: () => h(QueryNamespaceProbe),
      },
    })

    expect(wrapper.get('.query-namespace-probe').attributes('data-query-namespace'))
      .toBe('work_a0b1_c2d3')
  })

  it('leaves fallback identity resolution to the rendered View', async () => {
    const wrapper = await mountSuspended(ParagraphView, {
      slots: {
        content: () => h(QueryNamespaceProbe),
      },
    })

    expect(wrapper.get('.query-namespace-probe').attributes('data-query-namespace'))
      .toBeUndefined()
  })

  it('uses an identical namespace during SSR and client rendering', async () => {
    const props = {
      uuid: 'Stable-Paragraph-UUID',
      viewId: 'Work',
    }
    const slots = {
      content: () => h(QueryNamespaceProbe),
    }
    const serverHtml = await renderToString(h(ParagraphView, props, slots))
    const clientWrapper = await mountSuspended(ParagraphView, { props, slots })

    expect(serverHtml).toContain('data-query-namespace="work_stable_paragraph_uuid"')
    expect(clientWrapper.get('.query-namespace-probe').attributes('data-query-namespace'))
      .toBe('work_stable_paragraph_uuid')
  })
})
