import { defineEventHandler, getCookie } from 'h3'
import {
  LAYER_AUTH_PROTECTED_ACCESS_COOKIE_NAME,
  layerAuthClearProtectedAccessCookie,
  layerAuthGetProtectedAccessSecret,
  layerAuthIsProtectedAccessAuthenticated,
} from '../../utils/protectedAccess'

export default defineEventHandler(async (event) => {
  const secret = layerAuthGetProtectedAccessSecret()
  const protectedAuthenticated = secret
    ? await layerAuthIsProtectedAccessAuthenticated(event, secret)
    : false

  if (
    !protectedAuthenticated
    && getCookie(event, LAYER_AUTH_PROTECTED_ACCESS_COOKIE_NAME)
  ) {
    layerAuthClearProtectedAccessCookie(event)
  }

  return {
    protectedAuthenticated,
  }
})
