import {
  defineEventHandler,
  getRequestURL,
  sendRedirect,
  } from 'h3'
import { getStirDrupalApiConfig, markStirPrivateResponse } from '../utils/stirDrupalApi'

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

  markStirPrivateResponse(event)

  return sendRedirect(event, drupalUrl.toString(), 302)
})
