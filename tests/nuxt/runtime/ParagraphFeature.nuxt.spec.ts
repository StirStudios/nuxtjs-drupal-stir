import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ParagraphFeature from '../../../layers/theme/app/components/global/Paragraph/Feature.vue'

describe('ParagraphFeature (Nuxt runtime)', () => {
  it('renders one accessible Nuxt UI feature from the Drupal payload', async () => {
    const wrapper = await mountSuspended(ParagraphFeature, {
      props: {
        iconName: 'i-lucide-warehouse',
        header: 'Receive imported goods',
        headerTag: 'h3',
        text: '<p>Confirm the inventory before arrival.</p>',
        link: {
          url: '/services/ftz-warehousing',
        },
      },
    })

    const feature = wrapper.getComponent({ name: 'UPageFeature' })

    expect(feature.props()).toMatchObject({
      icon: 'i-lucide-warehouse',
      orientation: 'vertical',
      to: '/services/ftz-warehousing',
    })
    expect(wrapper.get('h3').text()).toBe('Receive imported goods')
    expect(wrapper.text()).toContain('Confirm the inventory before arrival.')
  })

  it('supports a non-linked feature', async () => {
    const wrapper = await mountSuspended(ParagraphFeature, {
      props: {
        header: 'Manage inventory',
      },
    })

    expect(wrapper.getComponent({ name: 'UPageFeature' }).props('to')).toBeUndefined()
  })
})
