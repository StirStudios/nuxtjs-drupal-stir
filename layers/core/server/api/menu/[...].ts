import { defineEventHandler, getRouterParams } from 'h3'
import { proxyStirDrupalMenuRequest } from '../../utils/drupalCeProxy'

export default defineEventHandler(async (event) => {
  return await proxyStirDrupalMenuRequest(event, getRouterParams(event)._ || '')
})
