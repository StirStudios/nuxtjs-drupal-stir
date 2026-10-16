import { getResponseStatus, setResponseHeader } from 'h3'

// Nitro serves a site's public/ files (fonts, logos, artwork) with no
// Cache-Control, so browsers and CDNs revalidate them on every view. They are
// not content-hashed, so this is a month rather than immutable. Route rules,
// such as the development no-store rule, run after this hook and still win.
const STATIC_FILE = /^\/(?!_nuxt\/|_ipx\/|api\/)[^?]*\.(?:avif|gif|ico|jpe?g|otf|png|svg|ttf|webp|woff2?)$/i
const STATIC_CACHE_CONTROL = 'public, max-age=2592000, stale-while-revalidate=86400'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    if (STATIC_FILE.test(event.path)) setResponseHeader(event, 'Cache-Control', STATIC_CACHE_CONTROL)
  })

  // A missing file must not be cached for a month.
  nitroApp.hooks.hook('beforeResponse', (event) => {
    if (event.node.res.headersSent || getResponseStatus(event) < 400) return
    if (STATIC_FILE.test(event.path)) setResponseHeader(event, 'Cache-Control', 'no-cache')
  })
})
