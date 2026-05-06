import { defineEventHandler } from 'h3'
import { drupalApiRequest } from '~~/server/utils/drupalApi'

type RegisterPolicyResponse = {
  allowed: boolean
  mode?: string
}

export default defineEventHandler(async (event): Promise<RegisterPolicyResponse> => {
  try {
    return await drupalApiRequest<RegisterPolicyResponse>(
      event,
      '/api/auth/register-policy',
      {
        method: 'GET',
        forwardCookies: true,
      },
    )
  } catch {
    // Fail closed if policy endpoint is unavailable.
    return { allowed: false }
  }
})
