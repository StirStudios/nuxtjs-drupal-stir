import { defineEventHandler, getRequestURL } from 'h3'
import { markStirPrivateResponse } from '../../../foundation/server/utils/stirDrupalApi'

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname

  if (!path.startsWith('/api/auth/') && !path.startsWith('/api/account/')) return

  markStirPrivateResponse(event)
})
