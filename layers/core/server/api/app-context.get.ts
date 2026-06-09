import { defineEventHandler, getQuery } from 'h3'
import { fetchAppContext } from '../utils/appContextApi'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const path = typeof query.path === 'string' ? query.path : ''

  return fetchAppContext(event, path)
})
