import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import NodePage from '../../../layers/theme/app/components/global/node--page.vue'

describe('NodePage (Nuxt runtime)', () => {
  it('renders configured page content without exposing ownership metadata', async () => {
    const wrapper = await mountSuspended(NodePage, {
      attrs: {
        'show-before-main': false,
      },
      slots: {
        section: '<section>Page content</section>',
        uid: '<span>field-entity-reference</span>',
      },
    })

    expect(wrapper.text()).toContain('Page content')
    expect(wrapper.text()).not.toContain('field-entity-reference')
  })
})
