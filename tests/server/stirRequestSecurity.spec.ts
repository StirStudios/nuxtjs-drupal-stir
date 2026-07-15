import { afterEach, describe, expect, it, vi } from 'vitest'
import { assertStirSameOrigin } from '../../layers/core/server/utils/stirRequestSecurity'

const createEvent = (headers: Record<string, string>) => ({
  context: {},
  method: 'POST',
  node: {
    req: {
      headers: {
        host: 'www.example.test',
        ...headers,
      },
      socket: {},
      url: '/api/account/settings/cancel',
    },
  },
}) as never

describe('same-origin mutation guard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('allows the configured public origin', () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      siteUrl: 'https://www.example.test',
    }))

    expect(() => assertStirSameOrigin(createEvent({
      origin: 'https://www.example.test',
    }))).not.toThrow()
  })

  it('blocks a same-site sibling origin', () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      siteUrl: 'https://www.example.test',
    }))

    expect(() => assertStirSameOrigin(createEvent({
      origin: 'https://malicious.example.test',
    }))).toThrow(expect.objectContaining({ statusCode: 403 }))
  })

  it('does not let Host override the configured public origin', () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      siteUrl: 'https://www.example.test',
    }))

    expect(() => assertStirSameOrigin(createEvent({
      host: 'malicious.example.test',
      origin: 'https://malicious.example.test',
    }))).toThrow(expect.objectContaining({ statusCode: 403 }))
  })

  it('does not allow Referer to override an explicit rejected Origin', () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      siteUrl: 'https://www.example.test',
    }))

    expect(() => assertStirSameOrigin(createEvent({
      origin: 'https://malicious.example.test',
      referer: 'https://www.example.test/account/settings',
    }))).toThrow(expect.objectContaining({ statusCode: 403 }))
  })

  it('accepts a browser-confirmed same-origin request without Origin', () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      siteUrl: 'https://www.example.test',
    }))

    expect(() => assertStirSameOrigin(createEvent({
      'sec-fetch-site': 'same-origin',
    }))).not.toThrow()
  })

  it('rejects a mutation without origin evidence', () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      siteUrl: 'https://www.example.test',
    }))

    expect(() => assertStirSameOrigin(createEvent({}))).toThrow(
      expect.objectContaining({ statusCode: 403 }),
    )
  })
})
