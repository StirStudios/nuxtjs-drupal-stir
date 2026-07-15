import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BlockContentParagraph from '../../../layers/theme/app/components/global/BlockContentParagraph.vue'

describe('BlockContentParagraph (Nuxt runtime)', () => {
  it('renders every exposed block-content field in producer order', async () => {
    const wrapper = await mountSuspended(BlockContentParagraph, {
      slots: {
        heading: '<h2>Reusable promotion</h2>',
        body: '<p>Direct block body</p>',
        action: '<a href="/contact">Contact us</a>',
      },
    })

    expect(wrapper.text()).toContain('Reusable promotion')
    expect(wrapper.text()).toContain('Direct block body')
    expect(wrapper.get('a').attributes('href')).toBe('/contact')
    expect(wrapper.html().indexOf('Reusable promotion')).toBeLessThan(
      wrapper.html().indexOf('Direct block body'),
    )
  })
})
