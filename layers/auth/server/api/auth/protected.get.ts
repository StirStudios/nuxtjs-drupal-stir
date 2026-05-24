import { defineEventHandler } from 'h3'
import {
  layerAuthGetProtectedAccessSecret,
  layerAuthIsProtectedAccessAuthenticated,
} from '../../utils/protectedAccess'

export default defineEventHandler((event) => {
  const secret = layerAuthGetProtectedAccessSecret()

  return {
    protectedAuthenticated: secret
      ? layerAuthIsProtectedAccessAuthenticated(event, secret)
      : false,
  }
})
