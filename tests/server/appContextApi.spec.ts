import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { drupalApiRequest } from '../../layers/core/server/utils/drupalApi'
import {
  appContextQuery,
  buildAppContextEndpoint,
  fetchAppContext,
  parseAppContextResponse,
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

  it('parses the producer fixture through the production boundary', () => {
    const fixture = JSON.parse(readFileSync(resolve(
      __dirname,
      '../../contracts/stir-tools/v1/fixtures/app-context.json',
    ), 'utf8'))

    const parsed = parseAppContextResponse(fixture)

    expect(parsed.blocks.after_main?.[0]?.element).toBe('block-content-basic')
    expect(parsed.footer_menu).toEqual([{ title: 'Privacy', url: '/privacy' }])
    expect(parsed.site_info.name).toBe('Fixture site')
  })

  it('normalizes Drupal empty-array blocks to an empty region map', () => {
    expect(parseAppContextResponse({
      blocks: [],
      footer_menu: [],
      site_info: { name: '', mail: '', slogan: '' },
    }).blocks).toEqual({})
  })

  it('rejects malformed producer payloads before they reach UI code', () => {
    expect(() => parseAppContextResponse({
      blocks: { after_main: [{ element: 'block-content-basic' }] },
      footer_menu: [],
      site_info: { name: '', mail: '', slogan: '' },
    })).toThrow('Invalid Drupal app-context contract at blocks.after_main.0')
  })

  it('forwards cookies so Drupal can include authenticated app context edit links', async () => {
    vi.mocked(drupalApiRequest).mockResolvedValue({
      blocks: {},
      footer_menu: [],
      site_info: { name: '', mail: '', slogan: '' },
    })

    const event = {} as Parameters<typeof fetchAppContext>[0]

    await fetchAppContext(event, '/')

    expect(drupalApiRequest).toHaveBeenCalledWith(event, '/api/app-context?path=%2F', {
      method: 'GET',
      forwardCookies: true,
    })
  })

  it('logs app context fetch failures while preserving the fallback response', async () => {
    const error = new Error('Drupal unavailable')

    Object.assign(error, {
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      request: {
        headers: {
          cookie: 'SSESS=secret',
          'x-api-key': 'secret-key',
        },
      },
    })

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.mocked(drupalApiRequest).mockRejectedValue(error)

    const event = {} as Parameters<typeof fetchAppContext>[0]

    await expect(fetchAppContext(event, '/broken')).resolves.toEqual({
      blocks: {},
      footer_menu: [],
      site_info: { name: '', mail: '', slogan: '' },
    })
    expect(consoleError).toHaveBeenCalledWith('Failed to fetch Drupal app context', {
      path: '/broken',
      message: 'Drupal unavailable',
      statusCode: 503,
      statusMessage: 'Service Unavailable',
    })

    consoleError.mockRestore()
  })
})
