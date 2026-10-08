import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ParagraphButton from '../../../layers/theme/app/components/global/Paragraph/Button.vue'

function mountPdfButton(linkTitle: string) {
  return mountSuspended(ParagraphButton, {
    props: { link: { title: linkTitle } },
    slots: {
      media: () => h('div', { type: 'document', url: '/files/catering.pdf', title: 'Catering menu' }),
    },
  })
}

describe('Paragraph Button (Nuxt runtime)', () => {
  it('labels a document button with the editor\'s link text', async () => {
    const wrapper = await mountPdfButton('Menu')

    expect(wrapper.get('button').text()).toBe('Menu')
  })

  it('falls back to the document\'s title when the link text is empty', async () => {
    const wrapper = await mountPdfButton('  ')

    expect(wrapper.get('button').text()).toBe('Catering menu')
  })
})
