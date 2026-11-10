import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { reactive } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { WebformFieldProps, WebformState } from '../../../layers/theme/app/types'
import FieldAvailabilityDate from '../../../layers/webform/app/components/Field/AvailabilityDate.vue'

registerEndpoint('/api/webform/availability', () => ({
  available: true,
  unavailable: ['2030-05-20'],
}))

describe('Webform availability date', () => {
  it('marks booked days unavailable and replaces the oldest date past the limit', async () => {
    const field: WebformFieldProps = {
      '#type': 'stir_availability_date',
      '#name': 'event_dates',
      '#title': 'Dates',
      '#multiple': true,
      '#cardinality': 2,
      '#dateMin': '2030-05-02',
      '#availabilityWebform': 'booking',
    }
    const state = reactive<WebformState>({ event_dates: [] })
    const wrapper = await mountSuspended(FieldAvailabilityDate, {
      props: { field, fieldName: 'event_dates', state },
    })

    await flushPromises()
    await vi.waitFor(() => {
      expect(cell(20).attributes('data-unavailable')).toBeDefined()
    })

    function cell(day: number) {
      return wrapper.find(`[data-reka-calendar-cell-trigger][data-value="2030-05-${day}"]`)
    }

    await cell(20).trigger('click')
    expect(state.event_dates).toEqual([])

    await cell(10).trigger('click')
    await cell(11).trigger('click')
    await cell(12).trigger('click')
    expect(state.event_dates).toEqual(['2030-05-11', '2030-05-12'])

    await wrapper.find('button[aria-label^="Remove"]').trigger('click')
    expect(state.event_dates).toEqual(['2030-05-12'])
  })
})
