import { defineEventHandler } from 'h3'
import { layerAuthDrupalApiRequest } from '../../utils/drupalApi'
import type { AuthUiConfig } from '../../../app/types/auth'

export default defineEventHandler(async (event): Promise<Partial<AuthUiConfig>> => {
  try {
    return await layerAuthDrupalApiRequest<AuthUiConfig>(
      event,
      '/api/auth/config',
      {
        method: 'GET',
        forwardCookies: true,
      },
    )
  } catch (error: unknown) {
    if (import.meta.dev) {
      console.warn(
        '[auth/config] Falling back to local auth UI config because Drupal config could not be loaded.',
        error,
      )
    }

    return {}
  }
})
