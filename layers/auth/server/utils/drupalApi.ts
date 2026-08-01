import type { H3Event } from 'h3'
import {
  appendStirDrupalSetCookies,
  extractStirDrupalErrorDetail,
  fetchStirDrupalCsrfToken,
  getStirDrupalApiConfig,
  getStirForwardedCookie,
  stirDrupalApiRequest,
  throwStirDrupalApiError,
  type StirDrupalRequestOptions,
} from '../../../foundation/server/utils/stirDrupalApi'

export function layerAuthGetDrupalApiConfig() {
  return getStirDrupalApiConfig()
}

export const layerAuthGetForwardedCookie = getStirForwardedCookie

export const layerAuthAppendDrupalSetCookies = appendStirDrupalSetCookies

export const layerAuthThrowDrupalApiError = throwStirDrupalApiError

export const layerAuthExtractDrupalErrorDetail = extractStirDrupalErrorDetail

export const layerAuthFetchDrupalCsrfToken = fetchStirDrupalCsrfToken

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
