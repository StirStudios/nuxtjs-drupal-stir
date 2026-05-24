import { defineEventHandler } from 'h3'
import { drupalApiRequest } from '../utils/drupalApi'

type LayoutBlocksResponse = {
  blocks?: Record<string, unknown>
}

export default defineEventHandler(async (event): Promise<LayoutBlocksResponse> => {
  try {
    return await drupalApiRequest<LayoutBlocksResponse>(event, '/api/layout-blocks', {
      method: 'GET',
    })
  }
  catch {
    return { blocks: {} }
  }
})
