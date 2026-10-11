import { defineEventHandler } from 'h3'
import {
  createStirDrupalUpstreamError,
  stirDrupalApiRequest,
} from '../../../foundation/server/utils/stirDrupalApi'
import type { AdminMenuResponse } from '../../shared/types/adminMenu'

// Drupal's administration sections the editor may open, with one level of
// children. Drupal checks access and caches the answer per permission set;
// the editor's session cookie is forwarded so it answers for them.
export default defineEventHandler(async (event) => {
  try {
    return await stirDrupalApiRequest<AdminMenuResponse>(
      event,
      '/api/auth/admin-menu?_format=json',
      {
        method: 'GET',
        forwardCookies: true,
      },
    )
  }
  catch (error) {
    throw createStirDrupalUpstreamError(error, 'Failed to load the administration menu.')
  }
})
