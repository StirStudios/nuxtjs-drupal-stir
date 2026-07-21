import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  layerAuthCreateProtectedAccessToken,
  layerAuthConstantTimeEquals,
  layerAuthVerifyProtectedAccessToken,
} from '../../layers/auth/server/utils/protectedAccessToken'

const SECRET = 'secret'
const NOW = new Date('2023-11-14T22:13:20.000Z')
const NODE_COMPATIBLE_TOKEN = 'eyJ2IjoxLCJleHAiOjE3MDAwMDAwNjB9.CXpMVZYMzU-y88XJW_epCAzK9L-NFZAGMp-9xOduOm0'

describe('protected access tokens', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates tokens compatible with the original Node HMAC base64url format', async () => {
    vi.setSystemTime(NOW)

    await expect(layerAuthCreateProtectedAccessToken(SECRET, 60)).resolves.toBe(NODE_COMPATIBLE_TOKEN)
  })

  it('verifies original Node HMAC base64url tokens', async () => {
    vi.setSystemTime(NOW)

    await expect(layerAuthVerifyProtectedAccessToken(NODE_COMPATIBLE_TOKEN, SECRET)).resolves.toBe(true)
  })

  it('compares protected passwords without normalizing whitespace', () => {
    expect(layerAuthConstantTimeEquals(' secret ', ' secret ')).toBe(true)
    expect(layerAuthConstantTimeEquals(' secret ', 'secret')).toBe(false)
  })

})
