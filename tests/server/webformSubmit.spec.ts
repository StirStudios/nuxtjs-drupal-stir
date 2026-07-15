import { readRawBody } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import webformSubmitHandler from '../../layers/webform/server/api/webform/submit.post'

vi.mock('h3', async (importOriginal) => ({
  ...(await importOriginal<typeof import('h3')>()),
  readRawBody: vi.fn(),
}))

const SESSION_NAME = `SSESS${'a'.repeat(32)}`

const createEvent = (headers: Record<string, string> = {}) => {
  const responseHeaders = new Map<string, string | string[]>()

  return {
    node: {
      req: { headers },
      res: {
        getHeader: (name: string) => responseHeaders.get(name.toLowerCase()),
        setHeader: (name: string, value: string | string[]) => {
          responseHeaders.set(name.toLowerCase(), value)
        },
      },
    },
  } as never
}

describe('POST /api/webform/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      apiKey: 'api-key',
      drupalRequestTimeoutMs: 2500,
      public: { api: 'https://cms.example.test' },
      webformSubmissionLimits: {
        maxRequestBytes: 1024,
        maxFileBytes: 512,
        maxFiles: 2,
        maxFields: 10,
      },
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('uses the same filtered Drupal session cookie for CSRF and submit', async () => {
    vi.mocked(readRawBody).mockResolvedValue(Buffer.from(JSON.stringify({
      webform_id: 'contact',
      turnstile_response: 'token',
    })))
    const raw = vi.fn()
      .mockResolvedValueOnce({
        _data: 'csrf-token',
        headers: { getSetCookie: () => [] },
        status: 200,
      })
      .mockResolvedValueOnce({
        _data: { ok: true },
        headers: { getSetCookie: () => [] },
        status: 200,
      })

    vi.stubGlobal('$fetch', { raw })

    const response = await webformSubmitHandler(createEvent({
      'content-type': 'application/json',
      cookie: `analytics=secret; ${SESSION_NAME}=session-value`,
      'x-forwarded-for': '203.0.113.50',
    }))

    expect(response).toEqual({ ok: true })
    expect(raw).toHaveBeenNthCalledWith(
      1,
      'https://cms.example.test/session/token',
      expect.objectContaining({
        headers: {
          cookie: `${SESSION_NAME}=session-value`,
          'x-api-key': 'api-key',
        },
        redirect: 'manual',
        timeout: 2500,
      }),
    )
    expect(raw).toHaveBeenNthCalledWith(
      2,
      'https://cms.example.test/api/stir_webform_rest/submit',
      expect.objectContaining({
        headers: expect.objectContaining({
          cookie: `${SESSION_NAME}=session-value`,
          'x-api-key': 'api-key',
          'x-csrf-token': 'csrf-token',
        }),
        redirect: 'manual',
        timeout: 2500,
      }),
    )
    expect(raw.mock.calls[1]?.[1]?.headers).not.toHaveProperty(
      'X-Forwarded-For',
    )
  })

  it('rejects an oversized declared request before reading its body', async () => {
    await expect(webformSubmitHandler(createEvent({
      'content-length': '1025',
      'content-type': 'application/json',
    }))).rejects.toMatchObject({ statusCode: 413 })

    expect(readRawBody).not.toHaveBeenCalled()
  })

  it('sanitizes upstream failures', async () => {
    vi.mocked(readRawBody).mockResolvedValue(Buffer.from(JSON.stringify({
      webform_id: 'contact',
      turnstile_response: 'token',
    })))
    const raw = vi.fn()
      .mockResolvedValueOnce({
        _data: 'csrf-token',
        headers: { getSetCookie: () => [] },
        status: 200,
      })
      .mockRejectedValueOnce(Object.assign(new Error('Database password leaked'), {
        statusCode: 500,
      }))

    vi.stubGlobal('$fetch', { raw })

    await expect(webformSubmitHandler(createEvent({
      'content-type': 'application/json',
    }))).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Form submission failed. Please try again later.',
    })
  })

  it('sanitizes upstream redirects instead of returning success', async () => {
    vi.mocked(readRawBody).mockResolvedValue(Buffer.from(JSON.stringify({
      webform_id: 'contact',
      turnstile_response: 'token',
    })))
    const raw = vi.fn()
      .mockResolvedValueOnce({
        _data: 'csrf-token',
        headers: { getSetCookie: () => [] },
        status: 200,
      })
      .mockResolvedValueOnce({
        _data: undefined,
        headers: { getSetCookie: () => [] },
        status: 302,
      })

    vi.stubGlobal('$fetch', { raw })

    await expect(webformSubmitHandler(createEvent({
      'content-type': 'application/json',
    }))).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Form submission failed. Please try again later.',
    })
  })
})
