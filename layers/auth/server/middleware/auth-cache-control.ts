import { defineEventHandler, getRequestURL } from 'h3'
import { markStirPrivateResponse } from '../../../foundation/server/utils/stirDrupalApi'

const PRIVATE_API_PREFIXES = ['/api/auth', '/api/account'] as const

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  // Matches the prefix itself as well as its children: a bare /api/auth must
  // not be left cacheable just because it has no trailing slash.
  const isPrivate = PRIVATE_API_PREFIXES.some(
    prefix => path === prefix || path.startsWith(`${prefix}/`),
  )

  if (!isPrivate) return

  markStirPrivateResponse(event)
})
