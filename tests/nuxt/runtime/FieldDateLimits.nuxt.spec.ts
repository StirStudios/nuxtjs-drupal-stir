import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import type { WebformFieldProps, WebformState } from '../../../layers/theme/app/types'
import FieldDate from '../../../layers/webform/app/components/Field/Date.vue'
import FieldDateTime from '../../../layers/webform/app/components/Field/DateTime.vue'

// Renders the calendar inline, as an open popover would.
const popoverStub = defineComponent({
  template: '<div><slot /><div data-popover-content><slot name="content" /></div></div>',
})

function dayStates(wrapper: Awaited<ReturnType<typeof mountSuspended>>): Map<number, boolean> {
  const states = new Map<number, boolean>()

  for (const cell of wrapper.findAll('[data-reka-calendar-cell-trigger]')) {
    if (cell.attributes('data-outside-view') !== undefined) continue
    states.set(Number(cell.text()), cell.attributes('data-disabled') !== undefined)
  }

  return states
}

describe('Webform date limits', () => {
  it('disables days outside #dateMin and #dateMax and keeps multiple selection', async () => {
    const field: WebformFieldProps = {
      '#type': 'date',
      '#name': 'event_dates',
      '#title': 'Select up to 3 dates in order of preference',
      '#multiple': true,
      '#cardinality': 3,
      '#dateMin': '2030-05-15',
      '#dateMax': '2030-05-25',
    }
    const state = reactive<WebformState>({ event_dates: ['2030-05-20'] })
    const wrapper = await mountSuspended(FieldDate, {
      global: { stubs: { UPopover: popoverStub } },
      props: { field, fieldName: 'event_dates', state },
    })
    const days = dayStates(wrapper)

    expect(days.get(14)).toBe(true)
    expect(days.get(15)).toBe(false)
    expect(days.get(25)).toBe(false)
    expect(days.get(26)).toBe(true)

    const cell = (day: number) => wrapper.findAll('[data-reka-calendar-cell-trigger]')
      .find(node => node.text() === String(day) && node.attributes('data-outside-view') === undefined)!

    await cell(10).trigger('click')
    await cell(16).trigger('click')
    expect(state.event_dates).toEqual(['2030-05-20', '2030-05-16'])
  })

  it('disables datetime days before #dateMin', async () => {
    const field: WebformFieldProps = {
      '#type': 'datetime',
      '#name': 'starts',
      '#title': 'Starts',
      '#timezone': 'America/Los_Angeles',
      '#dateMin': '2030-05-15',
    }
    const state = reactive<WebformState>({ 'starts-0': '2030-05-20T10:00:00' })
    const wrapper = await mountSuspended(FieldDateTime, {
      global: { stubs: { UPopover: popoverStub, LazyUCalendar: false } },
      props: { field, fieldName: 'starts', state },
    })
    const days = dayStates(wrapper)

    expect(days.get(14)).toBe(true)
    expect(days.get(15)).toBe(false)
    expect(days.get(31)).toBe(false)
  })
})
