import {
  defineEventHandler,
  getRequestURL,
  sendRedirect,
  setResponseHeader,
} from 'h3'
import { getStirDrupalApiConfig } from '../utils/stirDrupalApi'

const PRIVATE_NO_STORE = 'private, no-store, max-age=0'
const ONE_TIME_LOGIN_PATH = /^\/user\/reset\/\d+\/\d+\/[A-Za-z0-9_-]+\/login\/?$/

export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return

  const requestUrl = getRequestURL(event)

  if (!ONE_TIME_LOGIN_PATH.test(requestUrl.pathname)) return

  const { baseUrl } = getStirDrupalApiConfig()
  const drupalUrl = new URL(baseUrl)

  if (drupalUrl.origin === requestUrl.origin) return

  drupalUrl.pathname = requestUrl.pathname
  drupalUrl.search = requestUrl.search

  setResponseHeader(event, 'Cache-Control', PRIVATE_NO_STORE)

  return sendRedirect(event, drupalUrl.toString(), 302)
})
