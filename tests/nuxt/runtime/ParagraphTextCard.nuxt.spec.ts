import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ParagraphText from '../../../layers/theme/app/components/global/Paragraph/Text.vue'

describe('ParagraphText card presentation', () => {
  it('preserves the minimal rich-text markup by default', async () => {
    const wrapper = await mountSuspended(ParagraphText, {
      props: {
        text: '<p>Direct text</p>',
      },
    })

    expect(wrapper.findComponent({ name: 'UCard' }).exists()).toBe(false)
    expect(wrapper.text()).toContain('Direct text')
  })

  it('uses the shared Nuxt UI card when enabled', async () => {
    const wrapper = await mountSuspended(ParagraphText, {
      props: {
        card: true,
        text: '<p>Card text</p>',
      },
    })

    expect(wrapper.findComponent({ name: 'UCard' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('Card text')
  })
})
