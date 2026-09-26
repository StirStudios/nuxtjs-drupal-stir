import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h } from 'vue'
import { describe, expect, it } from 'vitest'
import ParagraphAccordion from '../../../layers/theme/app/components/global/Paragraph/Accordion.vue'

describe('ParagraphAccordion', () => {
  // Section headings belong to the Layout paragraph; the intro text stays.
  it('ignores a legacy group heading and keeps the intro text', async () => {
    const wrapper = await mountSuspended(ParagraphAccordion, {
      attrs: { header: 'Frequently asked questions', headerTag: 'h2' },
      props: { text: '<p>Common questions.</p>' },
      slots: {
        items: () => [h('paragraph-accordion-item', { header: 'Question', id: 1, text: '<p>Answer</p>' })],
      },
    })

    expect(wrapper.find('h2').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Frequently asked questions')
    expect(wrapper.find('[header]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Common questions.')
  })

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
