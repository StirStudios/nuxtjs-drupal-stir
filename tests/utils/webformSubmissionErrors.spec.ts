import { describe, expect, it } from 'vitest'
import { resolveWebformSubmissionIssues } from '../../layers/webform/app/utils/webformSubmissionErrors'

describe('resolveWebformSubmissionIssues', () => {
  it('shows Webform\'s messages and attaches them to their fields', () => {
    const issues = resolveWebformSubmissionIssues({
      error: {
        message: 'Submitted data contains validation errors.',
        details: {
          'event_dates][0': '<em class="placeholder">Select up to 3 dates</em> must be on or after <em class="placeholder">2026-10-14</em>.',
          'unknown_field': 'Ignored on the field, kept in the message.',
        },
        flat: [
          'Select up to 3 dates must be on or after 2026-10-14.',
          'Ignored on the field, kept in the message.',
        ],
      },
    }, ['event_dates'])

    expect(issues.message).toBe('Select up to 3 dates must be on or after 2026-10-14. Ignored on the field, kept in the message.')
    expect(issues.fieldErrors).toEqual([
      { name: 'event_dates', message: 'Select up to 3 dates must be on or after 2026-10-14.' },
    ])
  })

  it('falls back to the refusal message, then a generic one', () => {
    expect(resolveWebformSubmissionIssues({ error: { message: 'This webform is closed.', details: [], flat: [] } }, []).message)
      .toBe('This webform is closed.')
    expect(resolveWebformSubmissionIssues(undefined, []))
      .toEqual({ message: 'Form submission failed. Please try again.', fieldErrors: [] })
  })

  it('decodes escaped text in field messages', () => {
    expect(resolveWebformSubmissionIssues({
      error: { details: { name: 'Tom &amp; Jerry&#039;s <b>name</b>' } },
    }, ['name']).fieldErrors).toEqual([{ name: 'name', message: 'Tom & Jerry\'s name' }])
  })
})
