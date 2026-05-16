import { defineEventHandler } from 'h3'
import { drupalApiRequest } from '../../utils/drupalApi'

type GlobalSeoResponse = {
  lang?: string
  meta?: Array<Record<string, string>>
  link?: Array<Record<string, string>>
}

export default defineEventHandler(async (event) => {
  try {
    return await drupalApiRequest<GlobalSeoResponse>(event, '/api/seo/global', {
      method: 'GET',
    })
  } catch {
    return {
      meta: [],
      link: [],
    }
  }
})
