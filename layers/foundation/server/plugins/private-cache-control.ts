import { getResponseHeader, setResponseHeader } from 'h3'

const PRIVATE_NO_STORE = 'private, no-store, max-age=0'
const PRIVATE_DIRECTIVE = /(?:^|,)\s*(?:private|no-store)\b/i
const PUBLIC_DIRECTIVE = /(?:^|,)\s*public\b/i

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event) => {
    const cacheControl = String(
      getResponseHeader(event, 'Cache-Control') ?? '',
    )

    // Internal SSR requests can contribute cache directives to the final HTML
    // response. A public child payload must never weaken a private page.
    if (
      PRIVATE_DIRECTIVE.test(cacheControl)
      && PUBLIC_DIRECTIVE.test(cacheControl)
    ) {
      setResponseHeader(event, 'Cache-Control', PRIVATE_NO_STORE)
    }
  })
})
