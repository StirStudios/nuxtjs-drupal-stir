import type { H3Event } from 'h3'
import {
  appendStirDrupalSetCookies,
  assertStirDrupalResponseNotRedirect,
  captureStirDrupalApiError,
  fetchStirDrupalCsrfToken,
  getStirDrupalApiConfig,
  getStirForwardedCookie,
  markStirPrivateResponse,
  stirDrupalApiRequest,
  throwStirDrupalApiError,
  type StirDrupalRequestOptions,
} from '../../../../server/utils/stirDrupalApi'

export function getDrupalApiConfig() {
  return getStirDrupalApiConfig()
}

export const getForwardedCookie = getStirForwardedCookie

export const markPrivateResponse = markStirPrivateResponse

export const captureDrupalApiError = captureStirDrupalApiError

export const appendDrupalSetCookies = appendStirDrupalSetCookies

export const assertDrupalResponseNotRedirect =
  assertStirDrupalResponseNotRedirect

export const throwDrupalApiError = throwStirDrupalApiError

export const fetchDrupalCsrfToken = fetchStirDrupalCsrfToken

export async function drupalApiRequest<T>(
  event: H3Event,
  path: string,
  options: StirDrupalRequestOptions = {},
): Promise<T> {
  return await stirDrupalApiRequest<T>(event, path, options)
}
