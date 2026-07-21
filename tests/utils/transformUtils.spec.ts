import { describe, expect, it } from 'vitest'
import { serializeWebformSubmission } from '../../layers/webform/app/utils/transformUtils'

describe('serializeWebformSubmission', () => {
  it('preserves Drupal field and option machine names exactly', () => {
    expect(
      serializeWebformSubmission({
        hhhHhh: 'keepThisValue',
        mealChoice: ['glutenFree', 'chefSpecial'],
      }),
    ).toEqual({
      hhhHhh: 'keepThisValue',
      mealChoice: ['glutenFree', 'chefSpecial'],
    })
  })

  it('preserves composite keys and serializes booleans for Drupal', () => {
    expect(
      serializeWebformSubmission({
        addressField: {
          address: '123 Main Street',
          state_province: 'CA',
          postal_code: '93101',
        },
        acceptsTerms: true,
      }),
    ).toEqual({
      addressField: {
        address: '123 Main Street',
        state_province: 'CA',
        postal_code: '93101',
      },
      acceptsTerms: '1',
    })
  })
})
