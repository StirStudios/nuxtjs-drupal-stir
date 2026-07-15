import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import FieldLink from '../../../layers/theme/app/components/global/field-link.vue'

describe('field-link (Nuxt runtime)', () => {
  it('renders an external Drupal link with its accessible editor label', async () => {
    const wrapper = await mountSuspended(FieldLink, {
      props: {
        url: 'https://example.com/guide',
        label: 'Read the guide',
        external: true,
      },
    })

    const link = wrapper.get('a')

    expect(link.text()).toBe('Read the guide')
    expect(link.attributes('href')).toBe('https://example.com/guide')
    expect(link.attributes('data-external')).toBe('true')
    expect(link.attributes('target')).toBeUndefined()
  })

  it('supports presentation overrides through its default slot', async () => {
    const wrapper = await mountSuspended(FieldLink, {
      props: {
        url: '/guide',
        label: 'Fallback label',
      },
      slots: {
        default: 'Project guide',
      },
    })

    expect(wrapper.get('a').text()).toBe('Project guide')
  })
})
