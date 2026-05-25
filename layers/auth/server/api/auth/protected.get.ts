import { defineEventHandler } from 'h3'
import {
  layerAuthGetProtectedAccessSecret,
  layerAuthIsProtectedAccessAuthenticated,
} from '../../utils/protectedAccess'

export default defineEventHandler(async (event) => {
  const secret = layerAuthGetProtectedAccessSecret()
  const protectedAuthenticated = secret
    ? await layerAuthIsProtectedAccessAuthenticated(event, secret)
    : false

  return {
    protectedAuthenticated,
  }
})
