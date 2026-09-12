import type { H3Event } from 'h3'
import {
  stirDrupalApiRequest,
  type StirDrupalRequestOptions,
} from '../../../foundation/server/utils/stirDrupalApi'

/**
 * Auth and account calls forward a client IP by default so Drupal's flood
 * limits key on the visitor rather than on the Nitro proxy address.
 */
export async function layerAuthDrupalApiRequest<T>(
  event: unknown,
  path: string,
  options: StirDrupalRequestOptions = {},
): Promise<T> {
  return await stirDrupalApiRequest<T>(event as H3Event, path, {
    ...options,
    forwardClientIp: options.forwardClientIp ?? true,
  })
}
