import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  captureStirDrupalApiError,
  stirDrupalApiRequest,
} from '../../layers/foundation/server/utils/stirDrupalApi'
import {
  appContextQuery,
  buildAppContextEndpoint,
  fetchAppContext,
  parseAppContextResponse,
} from '../../layers/core/server/utils/appContextApi'

vi.mock('../../layers/foundation/server/utils/stirDrupalApi', () => ({
  stirDrupalApiRequest: vi.fn(),
  captureStirDrupalApiError: vi.fn(),
}))

describe('appContextApi', () => {
  beforeEach(() => {
    vi.mocked(stirDrupalApiRequest).mockReset()
    vi.mocked(captureStirDrupalApiError).mockReset()
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

    expect(parsed.blocks.after_main?.[0]).toMatchObject({
      element: 'block-content-paragraph',
      slots: {
        heading: '<h2>Reusable promotion</h2>',
        body: '<p>Direct block body.</p>',
        action: [{
          element: 'link',
          props: { href: '/contact', label: 'Contact us' },
        }],
        paragraphBlock: [{
          element: 'paragraph-layout',
          props: { layout: 'two_column', container: true },
        }],
      },
    })
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
      blocks: { after_main: [{ element: '' }] },
      footer_menu: [],
      site_info: { name: '', mail: '', slogan: '' },
    })).toThrow('Invalid Drupal app-context contract at blocks.after_main.0')
  })

  it('rejects malformed nested component content', () => {
    expect(() => parseAppContextResponse({
      blocks: {
        after_main: [{
          element: 'block-content-basic',
          props: {},
          slots: {
            section: [{ element: '', props: {}, slots: {} }],
          },
        }],
      },
      footer_menu: [],
      site_info: { name: '', mail: '', slogan: '' },
    })).toThrow('Invalid Drupal app-context contract at blocks.after_main.0')
  })

  it('forwards cookies so Drupal can include authenticated app context edit links', async () => {
    vi.mocked(stirDrupalApiRequest).mockResolvedValue({
      blocks: {},
      footer_menu: [],
      site_info: { name: '', mail: '', slogan: '' },
    })

    const event = {} as Parameters<typeof fetchAppContext>[0]

    await fetchAppContext(event, '/')

    expect(stirDrupalApiRequest).toHaveBeenCalledWith(event, '/api/app-context?path=%2F', {
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

    vi.mocked(stirDrupalApiRequest).mockRejectedValue(error)

    const event = {} as Parameters<typeof fetchAppContext>[0]

    await expect(fetchAppContext(event, '/broken')).resolves.toEqual({
      blocks: {},
      footer_menu: [],
      site_info: { name: '', mail: '', slogan: '' },
    })

    expect(captureStirDrupalApiError).toHaveBeenCalledTimes(1)

    const [capturedEvent, capturedError] = vi.mocked(
      captureStirDrupalApiError,
    ).mock.calls[0] as [unknown, Error]

    expect(capturedEvent).toBe(event)
    expect(capturedError.message).toBe(
      'Failed to fetch Drupal app context at /broken: Drupal unavailable'
      + ' (upstream 503 Service Unavailable)',
    )
    expect(capturedError.cause).toBe(error)

    // The captured message must never carry forwarded request credentials.
    expect(capturedError.message).not.toContain('SSESS=secret')
    expect(capturedError.message).not.toContain('secret-key')
  })
})
