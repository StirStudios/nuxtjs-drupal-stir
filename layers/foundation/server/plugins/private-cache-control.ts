import { getResponseHeader } from 'h3'
import { markStirPrivateResponse } from '../utils/stirDrupalApi'

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
      markStirPrivateResponse(event)
    }
  })
})
