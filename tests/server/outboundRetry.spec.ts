import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createOutboundDispatcher,
  shouldRetryOutbound,
} from '../../layers/foundation/server/utils/outboundRetry'

let server: Server | undefined

afterEach(() => {
  server?.close()
  server = undefined
})

// Resets the first connection before answering, then answers normally.
const resetOnce = async (status = 200) => {
  let requests = 0

  server = createServer((request, response) => {
    requests++
    if (requests === 1) {
      request.socket.destroy()
      return
    }
    response.statusCode = status
    response.end('ok')
  })
  await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve))

  return {
    origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    requests: () => requests,
  }
}

describe('outbound retry policy', () => {
  it('retries a request without a body after a connection error only', () => {
    expect(shouldRetryOutbound('GET', 'ECONNRESET')).toBe(true)
    expect(shouldRetryOutbound('head', 'UND_ERR_SOCKET')).toBe(true)
    expect(shouldRetryOutbound('POST', 'ECONNRESET')).toBe(false)
    expect(shouldRetryOutbound('GET', 'UND_ERR_HEADERS_TIMEOUT')).toBe(false)
    expect(shouldRetryOutbound('GET', undefined)).toBe(false)
  })
})

describe('outbound retry dispatcher', () => {
  it('sends a reset GET again on a fresh connection and logs it', async () => {
    const { origin, requests } = await resetOnce()
    const log = vi.fn()
    const response = await fetch(`${origin}/ce-api/page?x=1`, { dispatcher: createOutboundDispatcher(log) } as RequestInit)

    expect(await response.text()).toBe('ok')
    expect(requests()).toBe(2)
    expect(log).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`^\\[stir\\] retrying GET ${origin}/ce-api/page after (ECONNRESET|UND_ERR_SOCKET)$`)))
  })

  it('does not send a reset POST again', async () => {
    const { origin, requests } = await resetOnce()

    await expect(fetch(`${origin}/api/stir_webform_rest/submit`, {
      method: 'POST',
      body: '{}',
      dispatcher: createOutboundDispatcher(vi.fn()),
    } as RequestInit)).rejects.toThrow('fetch failed')
    expect(requests()).toBe(1)
  })

  it('passes an answer through, a 503 included, without retrying', async () => {
    let requests = 0

    server = createServer((_request, response) => {
      requests++
      response.statusCode = 503
      response.end('The site is being updated.')
    })
    await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve))
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const response = await fetch(`${origin}/api/sitemap`, { dispatcher: createOutboundDispatcher(vi.fn()) } as RequestInit)

    expect(response.status).toBe(503)
    expect(requests).toBe(1)
  })
})
