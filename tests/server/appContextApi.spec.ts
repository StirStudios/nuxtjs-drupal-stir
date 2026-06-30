import { beforeEach, describe, expect, it, vi } from 'vitest'
import { drupalApiRequest } from '../../layers/core/server/utils/drupalApi'
import {
  appContextQuery,
  buildAppContextEndpoint,
  fetchAppContext,
} from '../../layers/core/server/utils/appContextApi'

vi.mock('../../layers/core/server/utils/drupalApi', () => ({
  drupalApiRequest: vi.fn(),
}))

describe('appContextApi', () => {
  beforeEach(() => {
    vi.mocked(drupalApiRequest).mockReset()
  })

  it('builds the Drupal app context endpoint with route path context', () => {
    expect(appContextQuery('/contact')).toEqual({ path: '/contact' })
    expect(buildAppContextEndpoint('/contact')).toBe('/api/app-context?path=%2Fcontact')
  })

  it('keeps the app context route available without a path query', () => {
    expect(appContextQuery('')).toEqual({})
    expect(buildAppContextEndpoint('')).toBe('/api/app-context')
  })

  it('forwards cookies so Drupal can include authenticated app context edit links', async () => {
    vi.mocked(drupalApiRequest).mockResolvedValue({ blocks: {} })

    const event = {} as Parameters<typeof fetchAppContext>[0]

    await fetchAppContext(event, '/')

    expect(drupalApiRequest).toHaveBeenCalledWith(event, '/api/app-context?path=%2F', {
      method: 'GET',
      forwardCookies: true,
    })
  })

  it('logs app context fetch failures while preserving the fallback response', async () => {
    const error = new Error('Drupal unavailable')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.mocked(drupalApiRequest).mockRejectedValue(error)

    const event = {} as Parameters<typeof fetchAppContext>[0]

    await expect(fetchAppContext(event, '/broken')).resolves.toEqual({ blocks: {} })
    expect(consoleError).toHaveBeenCalledWith('Failed to fetch Drupal app context', {
      path: '/broken',
      error,
    })

    consoleError.mockRestore()
  })
})
