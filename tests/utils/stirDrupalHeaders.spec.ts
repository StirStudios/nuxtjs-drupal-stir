import { describe, expect, it } from 'vitest'
import { buildStirDrupalHeaders } from '../../layers/foundation/server/utils/stirDrupalApi'

describe('buildStirDrupalHeaders', () => {
  it('builds only the requested headers', () => {
    const headers = buildStirDrupalHeaders({
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
    const headers = buildStirDrupalHeaders({
      apiKey: ' ',
      cookie: '',
      csrfToken: '\n',
    })

    expect(headers).toEqual({})
  })
})
