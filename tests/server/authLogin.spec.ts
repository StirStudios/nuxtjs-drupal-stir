import { readBody } from 'h3'
import { afterEach, describe, expect, it, vi } from 'vitest'
import loginHandler from '../../layers/auth/server/api/auth/login.post'
import { assertStirSameOrigin } from '../../layers/core/server/utils/stirRequestSecurity'

vi.mock('h3', async (importOriginal) => ({
  ...(await importOriginal<typeof import('h3')>()),
  readBody: vi.fn(),
}))

const createEvent = (origin: string) => ({
  context: {},
  method: 'POST',
  node: {
    req: {
      headers: {
        host: 'www.example.test',
        origin,
      },
      socket: {},
      url: '/api/auth/login',
    },
  },
}) as never

describe('POST /api/auth/login', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('blocks cross-origin login attempts before reading credentials', async () => {
    vi.stubGlobal('assertStirSameOrigin', assertStirSameOrigin)
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      siteUrl: 'https://www.example.test',
    }))

    await expect(
      loginHandler(createEvent('https://malicious.example.test')),
    ).rejects.toMatchObject({ statusCode: 403 })
    expect(readBody).not.toHaveBeenCalled()
  })

  it('continues validating same-origin login requests', async () => {
    vi.stubGlobal('assertStirSameOrigin', assertStirSameOrigin)
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      siteUrl: 'https://www.example.test',
    }))
    vi.mocked(readBody).mockResolvedValue({})

    await expect(
      loginHandler(createEvent('https://www.example.test')),
    ).rejects.toMatchObject({ statusCode: 400 })
    expect(readBody).toHaveBeenCalledOnce()
  })
})
