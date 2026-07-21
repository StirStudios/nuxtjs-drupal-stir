import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { layerAuthDrupalApiRequest } from '../../layers/auth/server/utils/drupalApi'
import {
  fetchRegisterPolicy,
  parseRegisterPolicyResponse,
} from '../../layers/auth/server/utils/registerPolicyApi'

vi.mock('../../layers/auth/server/utils/drupalApi', () => ({
  layerAuthDrupalApiRequest: vi.fn(),
}))

describe('registerPolicyApi', () => {
  beforeEach(() => {
    vi.mocked(layerAuthDrupalApiRequest).mockReset()
  })

  it.each([
    'auth-register-policy-open.json',
    'auth-register-policy-closed.json',
  ])('parses synchronized producer fixture %s', (fixtureName) => {
    const fixture = JSON.parse(readFileSync(resolve(
      __dirname,
      `../../contracts/stir-tools/v1/fixtures/${fixtureName}`,
    ), 'utf8'))

    expect(parseRegisterPolicyResponse(fixture)).toEqual(fixture)
  })

  it('rejects contradictory open and closed policy values', () => {
    expect(() => parseRegisterPolicyResponse({
      allowed: true,
      mode: 'admin_only',
    })).toThrow('Invalid Drupal registration-policy contract at allowed')
  })

  it('rejects unknown Drupal registration modes', () => {
    expect(() => parseRegisterPolicyResponse({
      allowed: true,
      mode: 'custom_mode',
    })).toThrow('Invalid Drupal registration-policy contract at mode')
  })

  it('fetches public policy without forwarding visitor cookies', async () => {
    const policy = { allowed: true, mode: 'visitors' as const }

    vi.mocked(layerAuthDrupalApiRequest).mockResolvedValue(policy)
    const event = {} as Parameters<typeof fetchRegisterPolicy>[0]

    await expect(fetchRegisterPolicy(event)).resolves.toEqual(policy)
    expect(layerAuthDrupalApiRequest).toHaveBeenCalledWith(
      event,
      '/api/auth/register-policy',
      { method: 'GET' },
    )
  })

  it('fails closed when Drupal is unavailable or malformed', async () => {
    vi.mocked(layerAuthDrupalApiRequest).mockResolvedValue({
      allowed: true,
      mode: 'unknown',
    })
    const event = {} as Parameters<typeof fetchRegisterPolicy>[0]

    await expect(fetchRegisterPolicy(event)).resolves.toEqual({ allowed: false })
  })
})
