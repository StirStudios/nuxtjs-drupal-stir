import { describe, expect, it } from 'vitest'
import { isCloudflareAddress } from '../../layers/foundation/server/utils/cloudflareAddresses'

describe('isCloudflareAddress', () => {
  it('recognises Cloudflare edge addresses', () => {
    expect(isCloudflareAddress('173.245.48.1')).toBe(true)
    expect(isCloudflareAddress('104.16.123.96')).toBe(true)
    expect(isCloudflareAddress('2606:4700:3033::6815:3d5e')).toBe(true)
    expect(isCloudflareAddress('2a06:98c7::1')).toBe(true)
  })

  it('rejects everything else', () => {
    expect(isCloudflareAddress('99.8.0.119')).toBe(false)
    expect(isCloudflareAddress('51.81.245.200')).toBe(false)
    expect(isCloudflareAddress('173.245.64.1')).toBe(false)
    expect(isCloudflareAddress('2604:2dc0:200:13c8::100')).toBe(false)
    expect(isCloudflareAddress('not-an-ip')).toBe(false)
  })
})
