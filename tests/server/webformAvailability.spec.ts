import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import availabilityHandler from '../../layers/webform/server/api/webform/availability.get'

const createEvent = (path: string) => {
  const headers = new Map<string, string | string[]>()

  return {
    path,
    context: {},
    node: {
      req: { headers: {}, url: path },
      res: {
        getHeader: (name: string) => headers.get(name.toLowerCase()),
        setHeader: (name: string, value: string | string[]) => headers.set(name.toLowerCase(), value),
      },
    },
  } as unknown as H3Event
}

describe('GET /api/webform/availability', () => {
  const raw = vi.fn()

  beforeEach(() => {
    raw.mockReset()
    vi.stubGlobal('$fetch', { raw })
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      apiKey: 'api-key',
      drupalRequestTimeoutMs: 2500,
      public: { api: 'https://cms.example.test' },
    }))
  })

  it('returns the unavailable days from Drupal', async () => {
    raw.mockResolvedValue({
      status: 200,
      headers: new Headers(),
      _data: { available: true, unavailable: ['2030-05-20'] },
    })

    const result = await availabilityHandler(
      createEvent('/api/webform/availability?webform=book&element=dates&month=2030-05'),
    )

    expect(result).toEqual({ available: true, unavailable: ['2030-05-20'] })
    expect(raw.mock.calls[0]?.[0]).toBe('https://cms.example.test/api/stir/webform-availability/book/dates')
    expect(raw.mock.calls[0]?.[1]).toMatchObject({ query: { month: '2030-05' } })
  })

  it('rejects a malformed request without calling Drupal', async () => {
    await expect(availabilityHandler(
      createEvent('/api/webform/availability?webform=../x&element=dates&month=2030-05'),
    )).rejects.toMatchObject({ statusCode: 400 })
    expect(raw).not.toHaveBeenCalled()
  })

  it('reports a Drupal failure as an error', async () => {
    raw.mockRejectedValue(Object.assign(new Error('Unavailable'), { statusCode: 503 }))

    await expect(availabilityHandler(
      createEvent('/api/webform/availability?webform=book&element=dates&month=2030-05'),
    )).rejects.toMatchObject({ statusCode: expect.any(Number) })
  })
})
