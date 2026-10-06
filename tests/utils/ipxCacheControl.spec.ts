import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  createApp,
  eventHandler,
  fromNodeMiddleware,
  setResponseHeader,
  setResponseStatus,
  toNodeListener,
} from 'h3'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ipxErrorCacheControl } from '../../layers/theme/build/imageCdn'

// IPX is a dependency of @nuxt/image, not of the layer, so resolve it from there.
const imageRequire = createRequire(fileURLToPath(import.meta.resolve('@nuxt/image')))
const {
  createIPX,
  createIPXNodeHandler,
  ipxHttpStorage,
  parseIPXURL,
} = await import(pathToFileURL(imageRequire.resolve('ipx')).href)

// A 1x1 PNG served the way Drupal serves public files.
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)
const drupalFileCacheControl = 'max-age=315360000'

let server: Server
let origin: string

async function ipxHeaders(path: string) {
  const response = await fetch(`${origin}/_ipx/${path}`)

  await response.arrayBuffer()

  return {
    cacheControl: response.headers.get('cache-control'),
    status: response.status,
  }
}

beforeAll(async () => {
  const app = createApp()

  // What Nitro does for the theme layer's `/_ipx/**` route rule.
  app.use(eventHandler((event) => {
    if (event.path.startsWith('/_ipx/')) {
      setResponseHeader(event, 'cache-control', ipxErrorCacheControl)
    }
  }))
  app.use('/files', eventHandler((event) => {
    if (event.path !== '/photo.png') {
      setResponseStatus(event, 404)

      return 'Not found'
    }

    setResponseHeader(event, 'cache-control', drupalFileCacheControl)
    setResponseHeader(event, 'content-type', 'image/png')

    return png
  }))
  // Mounted the way @nuxt/image's `/_ipx` server route mounts it.
  app.use('/_ipx', fromNodeMiddleware(createIPXNodeHandler(
    createIPX({ storage: ipxHttpStorage({ domains: ['127.0.0.1'] }) }),
    {
      parseURL: (url: string) => {
        const parsed = new URL(url)

        return parseIPXURL(`${parsed.origin}${parsed.pathname.replace(/^\/_ipx/, '')}`)
      },
    },
  )))

  server = createServer(toNodeListener(app))
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterAll(async () => {
  await new Promise(resolve => server.close(resolve))
})

describe('IPX cache headers', () => {
  it('keeps the source file\'s long cache on a resized image', async () => {
    expect(await ipxHeaders(`f_webp&w_1/${origin}/files/photo.png`)).toEqual({
      cacheControl: 'max-age=315360000, public, s-maxage=315360000',
      status: 200,
    })
  })

  it.each([
    ['a missing source file', 404, () => `f_webp&w_1/${origin}/files/missing.png`],
    ['a host IPX does not trust', 403, () => 'f_webp&w_1/https://example.com/a.jpg'],
    ['an invalid modifier', 400, () => `w_abc/${origin}/files/photo.png`],
  ])('caches %s only briefly', async (_case, status, path) => {
    expect(await ipxHeaders(path())).toEqual({
      cacheControl: ipxErrorCacheControl,
      status,
    })
  })

  it('never marks the error header long-lived or immutable', () => {
    const maxAge = Number(/max-age=(\d+)/.exec(ipxErrorCacheControl)?.[1])

    expect(maxAge).toBeLessThanOrEqual(300)
    expect(ipxErrorCacheControl).not.toContain('immutable')
  })
})
