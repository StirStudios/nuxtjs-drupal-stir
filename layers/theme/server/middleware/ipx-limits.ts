import { defineEventHandler } from 'h3'
import { createIpxLimiter, resolveIpxConcurrency } from '../utils/ipxLimits'

// A burst of uncached gallery sizes otherwise decodes dozens of large masters
// at once and can push the process past its memory limit (the server unit's
// MemoryMax, 1G by default). IPX has no option for this, so run a bounded
// number of transforms, sized to the machine (resolveIpxConcurrency), each on
// one libvips thread, with libvips' cache off (Varnish/the CDN cache each
// derivative already). Too few queue a fresh page's images past the CDN's
// origin timeout, which fails them.
const limit = createIpxLimiter(resolveIpxConcurrency())
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
