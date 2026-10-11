import { afterEach, describe, expect, it, vi } from 'vitest'
import adminMenuHandler from '../../layers/editorial/server/api/admin-menu.get'
import adminMenu from '../../contracts/stir-tools/v1/fixtures/admin-menu.json'

describe('/api/admin-menu', () => {
  const SESSION = `SSESS${'a'.repeat(32)}=editor-session`
  const createEvent = () => ({
    context: {},
    node: {
      req: { headers: { 'sec-fetch-site': 'same-origin', 'cookie': SESSION } },
      res: { getHeader: () => undefined, removeHeader: () => {}, setHeader: () => {} },
    },
  }) as never

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('asks Drupal for the editor\'s own menu', async () => {
    const raw = vi.fn().mockResolvedValue({ _data: adminMenu, headers: { getSetCookie: () => [] } })

    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      apiKey: 'api-key',
      public: { api: 'https://cms.example.test' },
    }))
    vi.stubGlobal('$fetch', { raw })

    await expect(adminMenuHandler(createEvent())).resolves.toEqual(adminMenu)

    expect(raw).toHaveBeenCalledWith(
      'https://cms.example.test/api/auth/admin-menu?_format=json',
      expect.objectContaining({
        headers: expect.objectContaining({ cookie: SESSION }),
      }),
    )
  })

  it('passes Drupal\'s refusal through for editors without the menu', async () => {
    vi.stubGlobal('useRuntimeConfig', vi.fn().mockReturnValue({
      apiKey: 'api-key',
      public: { api: 'https://cms.example.test' },
    }))
    vi.stubGlobal('$fetch', {
      raw: vi.fn().mockRejectedValue(Object.assign(new Error('Forbidden'), {
        statusCode: 403,
        response: { status: 403, _data: { message: 'Forbidden' } },
      })),
    })

    await expect(adminMenuHandler(createEvent())).rejects.toMatchObject({ statusCode: 403 })
  })
})
