import { defineEventHandler } from 'h3'
import { createIpxLimiter } from '../utils/ipxLimits'

// A burst of uncached gallery sizes otherwise decodes dozens of large masters
// at once and pushes the process past a 1GB pm2 limit. IPX has no option for
// this, so run two transforms at a time, each on one libvips thread, with
// libvips' cache off (Varnish/the CDN cache each derivative already).
const limit = createIpxLimiter(2)
let sharpReady: Promise<void> | undefined

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/_ipx/')) return

  sharpReady ||= import('sharp').then(({ default: sharp }) => {
    sharp.cache(false)
    sharp.concurrency(1)
  })

  await sharpReady
  await limit(event)
})
