import { describe, expect, it } from 'vitest'
import { buildStirDrupalHeaders, getStirVisitorIp } from '../../layers/foundation/server/utils/stirDrupalApi'

describe('buildStirDrupalHeaders', () => {
  it('builds only the requested headers', () => {
    const headers = buildStirDrupalHeaders({
      apiKey: 'abc123',
      cookie: 'session=value',
      csrfToken: 'csrf-token',
    })

    expect(headers).toEqual({
      'x-api-key': 'abc123',
      cookie: 'session=value',
      'x-csrf-token': 'csrf-token',
    })
  })

  it('sends the visitor address in both real-IP headers', () => {
    expect(buildStirDrupalHeaders({ clientIp: '198.51.100.10' })).toEqual({
      'x-forwarded-for': '198.51.100.10',
      'x-real-ip': '198.51.100.10',
    })
  })

  it('omits blank values', () => {
    const headers = buildStirDrupalHeaders({
      apiKey: ' ',
      cookie: '',
      csrfToken: '\n',
    })

    expect(headers).toEqual({})
  })
})

describe('getStirVisitorIp', () => {
  const eventWith = (headers: Record<string, string>, remoteAddress = '127.0.0.1') => ({
    context: {},
    node: { req: { headers, socket: { remoteAddress } } },
  }) as never

  it('reads the address nginx set, never the visitor-controlled forwarded chain', () => {
    const event = eventWith({ 'x-forwarded-for': '203.0.113.9, 198.51.100.10', 'x-real-ip': '198.51.100.10' })

    expect(getStirVisitorIp(event, true)).toBe('198.51.100.10')
  })

  it('otherwise takes the forwarded entry the proxy wrote, never the visitor-controlled first one', () => {
    // An ingress that replaces the header, and one that appends to it.
    expect(getStirVisitorIp(eventWith({ 'x-forwarded-for': '198.51.100.10' }), true)).toBe('198.51.100.10')
    expect(getStirVisitorIp(eventWith({ 'x-forwarded-for': '203.0.113.9, 198.51.100.10' }), true)).toBe('198.51.100.10')
  })

  it('has no visitor address behind a proxy that sent neither header', () => {
    expect(getStirVisitorIp(eventWith({}), true)).toBeUndefined()
  })

  it('uses the socket address when the server faces visitors directly', () => {
    expect(getStirVisitorIp(eventWith({ 'x-real-ip': '203.0.113.9' }, '192.0.2.4'), false)).toBe('192.0.2.4')
  })
})

describe('getStirVisitorIp behind Cloudflare', () => {
  const eventWith = (headers: Record<string, string>) => ({
    context: {},
    node: { req: { headers, socket: { remoteAddress: '127.0.0.1' } } },
  }) as never

  it('takes the visitor from CF-Connecting-IP when the connection came from Cloudflare', () => {
    expect(getStirVisitorIp(eventWith({ 'x-real-ip': '104.16.123.96', 'cf-connecting-ip': '198.51.100.10' }), true))
      .toBe('198.51.100.10')
  })

  it('ignores CF-Connecting-IP from a visitor who reached the server directly', () => {
    expect(getStirVisitorIp(eventWith({ 'x-real-ip': '198.51.100.10', 'cf-connecting-ip': '203.0.113.9' }), true))
      .toBe('198.51.100.10')
  })

  it('never falls back to the Cloudflare edge as the visitor', () => {
    expect(getStirVisitorIp(eventWith({ 'x-real-ip': '104.16.123.96' }), true)).toBeUndefined()
  })
})
