import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import EditableRichText from '../../../layers/theme/app/components/global/EditableRichText.vue'
import RichTextHtml from '../../../layers/theme/app/components/RichTextHtml.vue'

describe('RichTextHtml override point', () => {
  it('renders trusted HTML in one element that takes the wrapper classes', async () => {
    const wrapper = await mountSuspended(RichTextHtml, {
      props: { html: '<p>Intro <strong>copy</strong></p>' },
      attrs: { class: 'lead prose' },
    })

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toEqual(['lead', 'prose'])
    expect(wrapper.element.innerHTML).toBe('<p>Intro <strong>copy</strong></p>')
  })

  it('renders EditableRichText output through RichTextHtml', async () => {
    const wrapper = await mountSuspended(EditableRichText, {
      props: { text: '<p>Intro</p>', classes: 'lead' },
    })
    const output = wrapper.findComponent(RichTextHtml)

    expect(output.exists()).toBe(true)
    expect(output.props('html')).toContain('<p>Intro</p>')
    expect(output.classes()).toEqual(['lead', 'prose', 'max-w-none'])
  })

  it('renders nothing for blank authored text', async () => {
    const wrapper = await mountSuspended(EditableRichText, {
      props: { text: '' },
    })

    expect(wrapper.findComponent(RichTextHtml).exists()).toBe(false)
  })
})
