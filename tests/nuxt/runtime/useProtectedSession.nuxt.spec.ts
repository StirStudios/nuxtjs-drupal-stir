import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { useProtectedSession } from '../../../layers/auth/app/composables/auth/useProtectedSession'

const shared = vi.hoisted(() => ({ fetch: vi.fn() }))

mockNuxtImport('useRequestFetch', () => () => shared.fetch)

describe('useProtectedSession', () => {
  it('shares one protected-access request across callers and refetches on force', async () => {
    shared.fetch.mockReset()
    shared.fetch.mockResolvedValue({ protectedAuthenticated: true })

    const first = useProtectedSession()
    const second = useProtectedSession()

    await Promise.all([first.fetchSession(), second.fetchSession()])

    expect(shared.fetch).toHaveBeenCalledTimes(1)
    expect(shared.fetch).toHaveBeenCalledWith('/api/auth/protected')
    expect(second.loggedIn.value).toBe(true)

    await first.fetchSession()
    expect(shared.fetch).toHaveBeenCalledTimes(1)

    shared.fetch.mockResolvedValue({ protectedAuthenticated: false })
    await first.fetchSession({ force: true })
    expect(shared.fetch).toHaveBeenCalledTimes(2)
    expect(second.loggedIn.value).toBe(false)
  })
})
