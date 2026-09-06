import { createServer } from 'node:http'
import { once } from 'node:events'
import { createApp, defineEventHandler, readRawBody, toNodeListener } from 'h3'
import { afterEach, describe, expect, it } from 'vitest'
import { readWebformBody } from '../../layers/webform/server/utils/readWebformBody'

const servers: ReturnType<typeof createServer>[] = []
const limits = { maxRequestBytes: 32, maxFileBytes: 16, maxFiles: 1, maxFields: 2 }

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
    server.closeAllConnections()
  })))
})

async function start(cached = false) {
  const app = createApp()

  app.use(defineEventHandler(async (event) => {
    if (cached) await readRawBody(event, false)
    return new TextDecoder().decode(await readWebformBody(event, limits))
  }))
  const server = createServer(toNodeListener(app))

  servers.push(server)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()

  if (!address || typeof address === 'string') throw new Error('Missing server address')
  return `http://127.0.0.1:${address.port}`
}

describe('bounded Webform body', () => {
  it('accepts and checks an already buffered H3 body', async () => {
    const url = await start(true)

    expect(await (await fetch(url, { method: 'POST', body: 'cached' })).text()).toBe('cached')
    expect((await fetch(url, { method: 'POST', body: 'a'.repeat(33) })).status).toBe(413)
  })

  it('reads an internal Nitro body without requiring a live socket', async () => {
    const event = { node: { req: {} }, _requestBody: 'internal' } as never

    expect(new TextDecoder().decode(await readWebformBody(event, limits))).toBe('internal')
    await expect(readWebformBody({ node: { req: {} }, _requestBody: 'x'.repeat(33) } as never, limits))
      .rejects.toMatchObject({ statusCode: 413 })
  })

  it('cancels native Web Request streams at the limit', async () => {
    let cancelled = false
    const body = new ReadableStream({
      start(controller) { controller.enqueue(new Uint8Array(33)) },
      cancel() { cancelled = true },
    })
    const request = new Request('http://localhost/', { method: 'POST', body, duplex: 'half' } as RequestInit)

    await expect(readWebformBody({ node: { req: {} }, web: { request } } as never, limits))
      .rejects.toMatchObject({ statusCode: 413 })
    expect(cancelled).toBe(true)
  })

  it('accepts a chunked body at the exact limit', async () => {
    const response = await fetch(await start(), {
      method: 'POST',
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('a'.repeat(16)))
          controller.enqueue(new TextEncoder().encode('b'.repeat(16)))
          controller.close()
        },
      }),
      duplex: 'half',
    } as RequestInit)

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('a'.repeat(16) + 'b'.repeat(16))
  })

  it('returns 413 without waiting for an oversized chunked body to end', async () => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const response = await fetch(await start(), {
      method: 'POST',
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(33))
          timer = setTimeout(() => controller.close(), 10_000)
        },
        cancel() { clearTimeout(timer) },
      }),
      duplex: 'half',
    } as RequestInit)

    clearTimeout(timer)
    expect(response.status).toBe(413)
    expect(response.headers.get('connection')).toBe('close')
    await response.text()
  })
})
