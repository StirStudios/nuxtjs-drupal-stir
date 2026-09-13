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

  it('exposes each item label at its authored heading level', async () => {
    // The trigger label renders inside UAccordion's native <button>, where a
    // real heading element is invalid HTML — role="heading" + aria-level
    // exposes the same level to heading navigation without that nesting.
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

    const label = wrapper.get('button [role="heading"]')

    expect(label.text()).toBe('Can I change my booking?')
    expect(label.attributes('aria-level')).toBe('3')
    expect(wrapper.find('button h3').exists()).toBe(false)
  })

  it('omits the heading role for a div/span headerTag', async () => {
    const wrapper = await mountSuspended(ParagraphAccordion, {
      slots: {
        items: () => [
          h('paragraph-accordion-item', {
            header: 'Not a heading',
            headerTag: 'span',
            id: 42,
            text: '<p>Answer</p>',
          }),
        ],
      },
    })

    expect(wrapper.find('[role="heading"]').exists()).toBe(false)
  })
})
