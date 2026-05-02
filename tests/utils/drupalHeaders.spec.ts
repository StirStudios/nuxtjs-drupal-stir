import { describe, expect, it } from 'vitest'
import { buildDrupalHeaders } from '../../server/utils/drupalHeaders'

describe('buildDrupalHeaders', () => {
  it('builds only the requested headers', () => {
    const headers = buildDrupalHeaders({
      apiKey: 'abc123',
      cookie: 'session=value',
      csrfToken: 'csrf-token',
    })

    expect(headers).toEqual({
      'x-api-key': 'abc123',
      cookie: 'session=value',
      'x-csrf-token': 'csrf-token',
    })
  })

  it('omits blank values', () => {
    const headers = buildDrupalHeaders({
      apiKey: ' ',
      cookie: '',
      csrfToken: '\n',
    })

    expect(headers).toEqual({})
  })
})
