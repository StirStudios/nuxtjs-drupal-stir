import { defineEventHandler, readBody } from 'h3'
import { layerAuthDrupalApiRequest } from '../../../utils/drupalApi'
import { throwStirDrupalApiError } from '../../../../../foundation/server/utils/stirDrupalApi'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    uid?: unknown
    timestamp?: unknown
    hash?: unknown
  }>(event)

  const uid =
    typeof body?.uid === 'number'
      ? body.uid
      : Number.parseInt(String(body?.uid ?? '0'), 10)
  const timestamp =
    typeof body?.timestamp === 'number'
      ? body.timestamp
      : Number.parseInt(String(body?.timestamp ?? '0'), 10)
  const hash = typeof body?.hash === 'string' ? body.hash.trim() : ''

  try {
    return await layerAuthDrupalApiRequest(event, '/api/auth/password/validate', {
      method: 'POST',
      body: {
        uid,
        timestamp,
        hash,
      },
    })
  } catch (error: unknown) {
    throwStirDrupalApiError(error, 'Password reset link is invalid or expired', 400)
  }
})
