import { describe, expect, it } from 'vitest'
import { formatWebformDateTime } from '../../layers/theme/app/utils/dateUtils'

describe('formatWebformDateTime', () => {
  it('uses the Drupal timezone for standard time', () => {
    expect(
      formatWebformDateTime(
        { year: 2026, month: 1, day: 15 },
        '10:30',
        'America/Los_Angeles',
      ),
    ).toBe('2026-01-15T10:30:00-0800')
  })

  it('uses the Drupal timezone for daylight saving time', () => {
    expect(
      formatWebformDateTime(
        { year: 2026, month: 7, day: 15 },
        '10:30',
        'America/Los_Angeles',
      ),
    ).toBe('2026-07-15T10:30:00-0700')
  })
})
