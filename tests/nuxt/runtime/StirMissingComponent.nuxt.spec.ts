import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import StirMissingComponent from '../../../layers/theme/app/components/global/Stir/MissingComponent.vue'

describe('StirMissingComponent (Nuxt runtime)', () => {
  it('identifies an unmapped Drupal field in development', async () => {
    const wrapper = await mountSuspended(StirMissingComponent, {
      props: {
        element: 'field-mystery',
        kind: 'unknown-field',
      },
    })

    expect(wrapper.text()).toContain('Unknown Drupal field component')
    expect(wrapper.text()).toContain('Unresolved Custom Element: field-mystery')
  })
})
