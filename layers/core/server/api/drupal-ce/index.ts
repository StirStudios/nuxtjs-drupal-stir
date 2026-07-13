import { defineEventHandler } from 'h3'
import { proxyStirDrupalCeRequest } from '../../utils/drupalCeProxy'

export default defineEventHandler(async (event) => {
  return await proxyStirDrupalCeRequest(event)
})
