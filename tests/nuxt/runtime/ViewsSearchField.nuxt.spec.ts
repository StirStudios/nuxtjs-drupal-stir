import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ViewsSearchField from '../../../layers/theme/app/components/Drupal/ViewsSearchField.vue'

describe('ViewsSearchField (Nuxt runtime)', () => {
  it('uses an accessible input without generating an unrelated form field id', async () => {
    const wrapper = await mountSuspended(ViewsSearchField, {
      props: {
        label: 'Category',
      },
    })

    const input = wrapper.get('input[type="search"]')

    expect(input.attributes('aria-label')).toBe('Category')
    expect(wrapper.find('label').exists()).toBe(false)
  })
})
