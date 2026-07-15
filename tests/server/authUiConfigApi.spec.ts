import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { layerAuthDrupalApiRequest } from '../../layers/auth/server/utils/drupalApi'
import {
  fetchAuthUiConfig,
  parseAuthUiConfigResponse,
} from '../../layers/auth/server/utils/authUiConfigApi'

vi.mock('../../layers/auth/server/utils/drupalApi', () => ({
  layerAuthDrupalApiRequest: vi.fn(),
}))

const producerFixture = () => JSON.parse(readFileSync(resolve(
  __dirname,
  '../../contracts/stir-tools/v1/fixtures/auth-ui-config.json',
), 'utf8'))

describe('authUiConfigApi', () => {
  beforeEach(() => {
    vi.mocked(layerAuthDrupalApiRequest).mockReset()
  })

  it('parses the synchronized producer fixture through the production boundary', () => {
    const fixture = producerFixture()

    expect(parseAuthUiConfigResponse(fixture)).toEqual(fixture)
  })

  it('rejects identifier modes that disagree with their field contract', () => {
    const fixture = producerFixture()

    fixture.login.identifier.mode = 'email'

    expect(() => parseAuthUiConfigResponse(fixture))
      .toThrow('Invalid Drupal auth UI config contract at login.identifier.mode')
  })

  it('rejects invalid password requirement patterns', () => {
    const fixture = producerFixture()

    fixture.passwordPolicy.requirements[0].pattern = '[invalid'

    expect(() => parseAuthUiConfigResponse(fixture))
      .toThrow('Invalid Drupal auth UI config contract at passwordPolicy.requirements.0.pattern')
  })

  it('rejects undocumented nested properties', () => {
    const fixture = producerFixture()

    fixture.login.legacyLabel = 'Legacy'

    expect(() => parseAuthUiConfigResponse(fixture))
      .toThrow('Invalid Drupal auth UI config contract at login')
  })

  it('fetches public UI config without forwarding visitor cookies', async () => {
    const fixture = producerFixture()

    vi.mocked(layerAuthDrupalApiRequest).mockResolvedValue(fixture)
    const event = {} as Parameters<typeof fetchAuthUiConfig>[0]

    await expect(fetchAuthUiConfig(event)).resolves.toEqual(fixture)
    expect(layerAuthDrupalApiRequest).toHaveBeenCalledWith(
      event,
      '/api/auth/config',
      { method: 'GET' },
    )
  })

  it('preserves the empty local fallback for an unavailable provider', async () => {
    vi.mocked(layerAuthDrupalApiRequest).mockRejectedValue(new Error('Unavailable'))
    const event = {} as Parameters<typeof fetchAuthUiConfig>[0]

    await expect(fetchAuthUiConfig(event)).resolves.toEqual({})
  })
})
