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

  it('keeps multiple components in an aligned region stacked vertically', async () => {
    const wrapper = await mountSuspended(ParagraphLayout, {
      props: {
        id: 'aligned-region',
        layout: 'two_column',
        regionAlign: {
          second: 'md:flex justify-center text-center',
        },
      },
      slots: {
        first: '<img class="contact-image" alt="" />',
        second: `
          <div class="contact-copy">Contact copy</div>
          <form class="contact-form">Contact form</form>
        `,
      },
    })

    expect(wrapper.find('.region.second').classes()).toEqual(
      expect.arrayContaining(['flex-col', 'md:flex', 'justify-center', 'text-center']),
    )
    expect(wrapper.find('.region.second > .contact-copy').exists()).toBe(true)
    expect(wrapper.find('.region.second > .contact-form').exists()).toBe(true)
  })

  it('can show the second region first only while a two-column layout is stacked', async () => {
    const wrapper = await mountSuspended(ParagraphLayout, {
      props: {
        id: 'reversed',
        layout: 'two_column_8_4',
        reverseMobile: true,
      },
      slots: {
        first: '<article>Form</article>',
        second: '<aside>Contact details</aside>',
      },
    })

    expect(wrapper.find('.region.first').classes()).toEqual(
      expect.arrayContaining(['order-2', 'lg:order-none']),
    )
    expect(wrapper.find('.region.second').classes()).toEqual(
      expect.arrayContaining(['order-1', 'lg:order-none']),
    )
  })

  it('ignores reversed mobile stacking for layouts with more than two columns', async () => {
    const wrapper = await mountSuspended(ParagraphLayout, {
      props: {
        id: 'four-column',
        layout: 'four_column',
        reverseMobile: true,
      },
      slots: {
        first: '<article>One</article>',
        second: '<article>Two</article>',
      },
    })

    expect(wrapper.find('.region.first').classes()).not.toContain('order-2')
    expect(wrapper.find('.region.second').classes()).not.toContain('order-1')
  })
})
