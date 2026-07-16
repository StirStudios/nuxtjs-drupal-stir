import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DateTimeValue from '../../../layers/theme/app/components/global/date-time-value.vue'

describe('date-time-value (Nuxt runtime)', () => {
  it('uses NuxtTime for a semantic localized datetime', async () => {
    const wrapper = await mountSuspended(DateTimeValue, {
      props: {
        datetime: '2026-07-15T18:30:00Z',
        locale: 'en-US',
        timeZone: 'America/Los_Angeles',
      },
    })

    const time = wrapper.get('time')

    expect(time.attributes('datetime')).toBe('2026-07-15T18:30:00.000Z')
    expect(time.text()).toContain('Jul 15, 2026')
    expect(time.text()).toContain('11:30 AM')
  })

  it('keeps date-only values stable across timezones', async () => {
    const wrapper = await mountSuspended(DateTimeValue, {
      props: {
        datetime: '2026-07-15',
        dateOnly: true,
        locale: 'en-US',
        timeZone: 'Pacific/Honolulu',
      },
    })

    expect(wrapper.get('time').text()).toBe('Jul 15, 2026')
  })

  it('supports a project-specific presentation slot', async () => {
    const wrapper = await mountSuspended(DateTimeValue, {
      props: { datetime: '2026-07-15', dateOnly: true },
      slots: { default: 'Opening night' },
    })

    expect(wrapper.text()).toBe('Opening night')
    expect(wrapper.find('time').exists()).toBe(false)
  })
})
