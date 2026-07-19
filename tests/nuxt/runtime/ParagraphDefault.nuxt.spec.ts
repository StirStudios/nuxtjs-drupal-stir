import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ParagraphDefault from '../../../layers/theme/app/components/global/Paragraph/Default.vue'

describe('ParagraphDefault (Nuxt runtime)', () => {
  it('renders known nested content without leaking payload props', async () => {
    const wrapper = await mountSuspended(ParagraphDefault, {
      attrs: {
        portfolio: 'Production',
      },
      props: {
        element: 'paragraph-project',
        id: 96,
        uuid: 'cbe546bb-ec1a-4c89-a45a-9055b084c6b5',
      },
      slots: {
        section: '<p>Known nested media</p>',
      },
    })

    expect(wrapper.text()).toContain('Known nested media')
    expect(wrapper.html()).not.toContain('portfolio="Production"')
  })
})
