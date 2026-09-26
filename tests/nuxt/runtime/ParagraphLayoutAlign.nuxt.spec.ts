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
})
