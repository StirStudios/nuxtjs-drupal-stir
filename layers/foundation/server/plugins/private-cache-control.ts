import { getResponseHeader, getResponseStatus, setResponseHeader } from 'h3'
import { markStirPrivateResponse } from '../utils/stirDrupalApi'

const PRIVATE_DIRECTIVE = /(?:^|,)\s*(?:private|no-store)\b/i
const PUBLIC_DIRECTIVE = /(?:^|,)\s*public\b/i
const PRIVATE_NO_STORE = 'private, no-store, max-age=0'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event) => {
    const cacheControl = String(
      getResponseHeader(event, 'Cache-Control') ?? '',
    )

    // Nitro's error handler marks an error response no-cache, but Nuxt's
    // inline error rendering bypasses it, so an error page would otherwise go
    // out with no directive for a CDN to honour. JSON errors, including the
    // internal requests a page renders from, still pass through Nitro's.
    if (
      !cacheControl
      && getResponseStatus(event) >= 400
      && String(getResponseHeader(event, 'Content-Type') ?? '').startsWith('text/html')
    ) {
      setResponseHeader(event, 'Cache-Control', 'no-cache')
      return
    }

    // Internal SSR requests can contribute cache directives to the final HTML
    // response. A public child payload must never weaken a private page, and
    // a private one appended to a private page collapses back to one value.
    if (
      (PRIVATE_DIRECTIVE.test(cacheControl) && PUBLIC_DIRECTIVE.test(cacheControl))
      || (cacheControl.includes(PRIVATE_NO_STORE) && cacheControl !== PRIVATE_NO_STORE)
    ) {
      markStirPrivateResponse(event)
    }
  })
})
