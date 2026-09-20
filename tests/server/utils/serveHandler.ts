import { createServer } from 'node:http'
import { once } from 'node:events'
import { createApp, toNodeListener, type EventHandler } from 'h3'

const servers: ReturnType<typeof createServer>[] = []

/**
 * Serves one handler over a real HTTP server and returns its base URL.
 *
 * Tests then drive it with fetch, so the handler receives a genuine H3 event:
 * real headers, a real body to parse and real error responses, instead of a
 * hand-built object cast to H3Event with h3 itself mocked out.
 */
export async function serveHandler(handler: EventHandler): Promise<string> {
  const app = createApp()

  app.use(handler)

  const server = createServer(toNodeListener(app))

  servers.push(server)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')

  const address = server.address()

  if (!address || typeof address === 'string') {
    throw new Error('Missing server address')
  }

  return `http://127.0.0.1:${address.port}`
}

/**
 * Closes every server a test started. Call from afterEach.
 */
export async function closeServedHandlers(): Promise<void> {
  await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
    server.closeAllConnections()
  })))
}
