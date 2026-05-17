import { describe, expect, it } from 'vitest'
import { formatScheduleRange } from '../../layers/theme/app/utils/schedule'

describe('schedule utils', () => {
  it('formats with an explicit timezone', () => {
    const start = new Date('2026-05-20T03:30:00Z')
    const end = new Date('2026-05-20T05:30:00Z')

    expect(
      formatScheduleRange(start, end, false, {
        timeZone: 'America/Los_Angeles',
      }),
    ).toBe('Tue, May 19, 8:30 - 10:30 PM')
  })

  it('compares range dates in the explicit timezone', () => {
    const start = new Date('2026-05-20T06:30:00Z')
    const end = new Date('2026-05-20T08:30:00Z')

    expect(
      formatScheduleRange(start, end, false, {
        timeZone: 'America/Los_Angeles',
      }),
    ).toBe('Tue, May 19, 11:30 PM - Wed, May 20, 1:30 AM')
  })

  it('uses the process runtime timezone when timezone is omitted', () => {
    const start = new Date('2026-05-20T03:30:00Z')
    const end = new Date('2026-05-20T05:30:00Z')

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })

    const dateLabel = dateFormatter.format(start)
    const startTime = timeFormatter.format(start)
    const endTime = timeFormatter.format(end)
    const startDayPeriod = timeFormatter
      .formatToParts(start)
      .find((part) => part.type === 'dayPeriod')?.value
    const endDayPeriod = timeFormatter
      .formatToParts(end)
      .find((part) => part.type === 'dayPeriod')?.value

    const expected =
      startDayPeriod && startDayPeriod === endDayPeriod
        ? `${dateLabel}, ${startTime.replace(
            new RegExp(`\\s*${startDayPeriod}$`),
            '',
          )} - ${endTime}`
        : `${dateLabel}, ${startTime} - ${endTime}`

    expect(formatScheduleRange(start, end)).toBe(expected)
  })
})
