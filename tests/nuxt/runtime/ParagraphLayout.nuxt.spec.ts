import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h } from 'vue'
import ParagraphLayout from '../../../layers/theme/app/components/global/Paragraph/Layout.vue'

describe('ParagraphLayout (Nuxt runtime)', () => {
  it('renders repeatable grid items directly for grid layouts', async () => {
    const wrapper = await mountSuspended(ParagraphLayout, {
      props: {
        id: 'grid',
        layout: 'grid',
        gridClass: 'grid gap-4 md:grid-cols-2',
      },
      slots: {
        items: `
          <article class="grid-item">One</article>
          <article class="grid-item">Two</article>
        `,
      },
    })

    const gridItems = wrapper.findAll('.grid-item')

    expect(wrapper.find('.md\\:grid-cols-2').exists()).toBe(true)
    expect(gridItems).toHaveLength(2)
    expect(wrapper.find('.region.items').exists()).toBe(false)
  })

  it('renders direct producer named regions recursively', async () => {
    const wrapper = await mountSuspended(ParagraphLayout, {
      props: {
        id: 'default',
        layout: 'two_column',
      },
      slots: {
        first: '<article class="first-item">First</article>',
        second: () => h(ParagraphLayout, {
          id: 'nested',
          layout: 'one_column',
        }, {
          first: () => h('article', { class: 'nested-item' }, 'Nested'),
        }),
      },
    })

    expect(wrapper.find('.region.first > .first-item').exists()).toBe(true)
    expect(wrapper.find('.region.second .region.first > .nested-item').exists()).toBe(true)
  })
})
