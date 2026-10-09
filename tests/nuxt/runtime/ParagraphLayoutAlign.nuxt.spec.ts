import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ParagraphLayout from '../../../layers/theme/app/components/global/Paragraph/Layout.vue'

describe('ParagraphLayout text alignment', () => {
  it('applies the Layout\'s text alignment to its heading and content', async () => {
    const wrapper = await mountSuspended(ParagraphLayout, {
      props: { id: 'aligned', header: 'Section heading', gridClass: {}, align: { text: 'center' } },
      slots: { first: '<p>Body</p>' },
    })
    const heading = wrapper.get('h2')

    expect(heading.element.closest('.text-center')).not.toBeNull()
    expect(wrapper.get('p').element.closest('.text-center')).not.toBeNull()
    wrapper.unmount()
  })

  it('adds no text alignment when the Layout sets none', async () => {
    const wrapper = await mountSuspended(ParagraphLayout, {
      props: { id: 'plain', header: 'Section heading', gridClass: {}, align: { justify: 'center' } },
      slots: { first: '<p>Body</p>' },
    })

    expect(wrapper.find('.text-center, .text-start, .text-end').exists()).toBe(false)
    wrapper.unmount()
  })

  const grid = { columns: { default: 1, sm: 2, lg: 3 }, gap: { sm: 4, lg: 6 } }

  for (const items of ['start', 'center', 'end'] as const) {
    it(`aligns region columns to ${items}`, async () => {
      const wrapper = await mountSuspended(ParagraphLayout, {
        props: { id: `regions-${items}`, layout: 'three_column', header: 'Heading', gridClass: grid, width: 'xs', align: { items } },
        slots: { first: '<p>One</p>', second: '<img alt="">', third: '<p>Three</p>' },
      })
      const region = wrapper.get('.region.second').element

      expect(region.parentElement?.classList).toContain(`items-${items}`)
      expect(region.parentElement?.classList).toContain('grid')
      expect(wrapper.get('h2').classes()).toContain('col-span-full')
      expect(wrapper.find('.md\\:flex').exists()).toBe(false)
      wrapper.unmount()
    })

    it(`aligns grid items to ${items}`, async () => {
      const wrapper = await mountSuspended(ParagraphLayout, {
        props: { id: `items-${items}`, layout: 'grid', gridClass: grid, align: { items } },
        slots: { items: '<div class="card">A</div><div class="card">B</div>' },
      })

      expect(wrapper.get('.card').element.parentElement?.classList).toContain(`items-${items}`)
      wrapper.unmount()
    })
  }

  it('adds no vertical alignment when Align is unset or horizontal/text only', async () => {
    for (const align of [undefined, { justify: 'center' as const }, { text: 'center' as const }]) {
      const wrapper = await mountSuspended(ParagraphLayout, {
        props: { id: 'unset', layout: 'three_column', gridClass: grid, align },
        slots: { first: '<p>One</p>', second: '<p>Two</p>' },
      })

      expect(wrapper.find('.items-start, .items-center, .items-end').exists()).toBe(false)
      wrapper.unmount()
    }
  })
})
