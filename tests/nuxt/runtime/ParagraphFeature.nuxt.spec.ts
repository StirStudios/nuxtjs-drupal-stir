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

    const feature = wrapper.getComponent({ name: 'UPageCard' })

    expect(feature.props()).toMatchObject({
      icon: 'i-lucide-warehouse',
      orientation: 'vertical',
      to: '/services/ftz-warehousing',
      variant: 'outline',
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

    expect(wrapper.getComponent({ name: 'UPageCard' }).props('to')).toBeUndefined()
  })

  it('renders a titled Drupal link as a visible action without nesting links', async () => {
    const wrapper = await mountSuspended(ParagraphFeature, {
      props: {
        header: 'FTZ warehousing',
        link: {
          title: 'Explore FTZ warehousing',
          url: '/services/ftz-warehousing',
        },
      },
    })

    expect(wrapper.getComponent({ name: 'UPageCard' }).props('to')).toBeUndefined()
    expect(wrapper.getComponent({ name: 'UButton' }).props()).toMatchObject({
      label: 'Explore FTZ warehousing',
      to: '/services/ftz-warehousing',
      trailingIcon: 'i-lucide-arrow-right',
      variant: 'link',
    })
    expect(wrapper.findAll('a')).toHaveLength(1)
  })

  it('passes supported Drupal card variants to Nuxt UI', async () => {
    const wrapper = await mountSuspended(ParagraphFeature, {
      props: {
        cardVariant: 'solid',
        header: 'Secure storage',
      },
    })

    expect(wrapper.getComponent({ name: 'UPageCard' }).props('variant')).toBe('solid')
  })
})
