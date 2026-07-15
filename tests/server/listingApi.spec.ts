import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  isPrivateStirListingResponse,
  parseStirListingId,
  parseStirListingResponse,
} from '../../layers/core/server/utils/listingApi'

const producerFixture = () => JSON.parse(readFileSync(resolve(
  __dirname,
  '../../contracts/stir-tools/v1/fixtures/listing-response.json',
), 'utf8'))

describe('Stir listing API contract', () => {
  it('parses the synchronized producer fixture', () => {
    const fixture = producerFixture()

    expect(parseStirListingResponse(fixture)).toEqual(fixture)
  })

  it('rejects undocumented response properties', () => {
    const fixture = producerFixture()

    fixture.performance = { totalTimeMs: 10 }

    expect(() => parseStirListingResponse(fixture)).toThrowError()
  })

  it('rejects invalid paging and privacy metadata', () => {
    const fixture = producerFixture()

    fixture.pager.pageSize = 101
    fixture.meta.personalized = 'false'

    expect(() => parseStirListingResponse(fixture)).toThrowError()
  })

  it('accepts only bounded Drupal machine names', () => {
    expect(parseStirListingId('editorial_articles')).toBe('editorial_articles')
    expect(() => parseStirListingId('../articles')).toThrowError()
    expect(() => parseStirListingId('Articles')).toThrowError()
  })

  it.each([
    [false, false, false, false],
    [true, false, false, true],
    [false, true, false, true],
    [false, false, true, true],
  ])(
    'derives response privacy from request, session, and producer signals',
    (hasRequestCookie, setsSessionCookie, personalized, expected) => {
      expect(isPrivateStirListingResponse({
        hasRequestCookie,
        setsSessionCookie,
        personalized,
      })).toBe(expected)
    },
  )
})
