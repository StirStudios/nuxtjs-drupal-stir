import { defineEventHandler, getQuery } from 'h3'
import { drupalApiRequest } from '../utils/drupalApi'

type LayoutBlocksResponse = {
  blocks?: Record<string, unknown>
  footer_menu?: Array<{
    title?: string
    url?: string
  }>
  site_info?: {
    name?: string
    mail?: string
    slogan?: string
    [key: string]: unknown
  }
}

export default defineEventHandler(async (event): Promise<LayoutBlocksResponse> => {
  const query = getQuery(event)
  const path = typeof query.path === 'string' ? query.path : ''
  const endpoint = path
    ? `/api/layout-blocks?${new URLSearchParams({ path }).toString()}`
    : '/api/layout-blocks'

  try {
    return await drupalApiRequest<LayoutBlocksResponse>(event, endpoint, {
      method: 'GET',
    })
  }
  catch {
    return { blocks: {} }
  }
})
