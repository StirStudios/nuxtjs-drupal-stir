import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ViewsDateRangeFilter from '../../../layers/theme/app/components/Drupal/ViewsDateRangeFilter.vue'

describe('ViewsDateRangeFilter (Nuxt runtime)', () => {
  it('renders serialized filter dates as an accessible range label', async () => {
    const wrapper = await mountSuspended(ViewsDateRangeFilter, {
      props: {
        label: 'Published',
        locale: 'en-US',
        modelValue: ['2026-01-01', '2026-01-31'],
      },
    })

    expect(wrapper.get('button').attributes('aria-label')).toBe('Published')
    expect(wrapper.text()).toContain('Jan 1, 2026 – Jan 31, 2026')
  })
})
