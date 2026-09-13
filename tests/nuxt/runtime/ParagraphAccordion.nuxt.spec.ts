import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h } from 'vue'
import { describe, expect, it } from 'vitest'
import ParagraphAccordion from '../../../layers/theme/app/components/global/Paragraph/Accordion.vue'

describe('ParagraphAccordion', () => {
  it('gives blank authored headers an accessible fallback label', async () => {
    const wrapper = await mountSuspended(ParagraphAccordion, {
      slots: {
        items: () => [
          h('paragraph-accordion-item', {
            header: '   ',
            id: 42,
            text: '<p>Answer</p>',
          }),
        ],
      },
    })

    expect(wrapper.get('button').text()).toContain('Item 1')
  })

  it('renders each item label at its authored heading level', async () => {
    const wrapper = await mountSuspended(ParagraphAccordion, {
      slots: {
        items: () => [
          h('paragraph-accordion-item', {
            header: 'Can I change my booking?',
            headerTag: 'h3',
            id: 42,
            text: '<p>Yes, contact the venue.</p>',
          }),
        ],
      },
    })

    const heading = wrapper.get('button h3')

    expect(heading.text()).toBe('Can I change my booking?')
  })
})
