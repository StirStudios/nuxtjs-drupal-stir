import { defineEventHandler, readBody } from 'h3'
import { drupalApiRequest, throwDrupalApiError } from '../../utils/drupalApi'

type EmailPayload = {
  mail?: unknown
}

export default defineEventHandler(async (event) => {
  const body = await readBody<EmailPayload>(event)
  const mail = typeof body?.mail === 'string' ? body.mail.trim() : ''

  try {
    return await drupalApiRequest<Record<string, unknown>>(
      event,
      '/api/account/email',
      {
        method: 'PATCH',
        body: { mail },
        forwardCookies: true,
      },
    )
  } catch (error: unknown) {
    throwDrupalApiError(error, 'Failed to update email')
  }
})

