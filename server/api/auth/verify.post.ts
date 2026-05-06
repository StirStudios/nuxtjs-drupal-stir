import { defineEventHandler, readBody } from 'h3'
import { drupalApiRequest, throwDrupalApiError } from '../../../utils/drupalApi'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    uid?: unknown
    timestamp?: unknown
    token?: unknown
  }>(event)

  const uid =
    typeof body?.uid === 'number'
      ? body.uid
      : Number.parseInt(String(body?.uid ?? '0'), 10)
  const timestamp =
    typeof body?.timestamp === 'number'
      ? body.timestamp
      : Number.parseInt(String(body?.timestamp ?? '0'), 10)
  const token = typeof body?.token === 'string' ? body.token.trim() : ''

  try {
    return await drupalApiRequest(event, '/api/auth/verify', {
      method: 'POST',
      body: {
        uid,
        timestamp,
        token,
      },
    })
  } catch (error: unknown) {
    throwDrupalApiError(error, 'Account verification failed')
  }
})
