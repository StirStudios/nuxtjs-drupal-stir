import { defineEventHandler } from 'h3'
import { createIpxLimiter, resolveIpxLimits } from '../utils/ipxLimits'

// IPX has no concurrency or libvips cache option, so bound both here before
// @nuxt/image's /_ipx handler runs.
let limit: ReturnType<typeof createIpxLimiter> | undefined
let sharpReady: Promise<unknown> | undefined

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/_ipx/')) return

  const limits = resolveIpxLimits(useRuntimeConfig(event).stirIpx)

  sharpReady ||= import('sharp').then(({ default: sharp }) => {
    sharp.cache(limits.sharpCacheMb > 0 ? { memory: limits.sharpCacheMb } : false)
    sharp.concurrency(limits.sharpConcurrency)
  })
  limit ||= createIpxLimiter(limits.maxConcurrent)

  await sharpReady
  await limit(event)
})
