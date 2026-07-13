import { defineEventHandler, getRequestURL, setResponseHeader } from 'h3'

const PRIVATE_NO_STORE = 'private, no-store, max-age=0'

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname

  if (!path.startsWith('/api/auth/') && !path.startsWith('/api/account/')) return

  setResponseHeader(event, 'Cache-Control', PRIVATE_NO_STORE)
})
