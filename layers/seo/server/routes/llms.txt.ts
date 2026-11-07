import { createError, defineEventHandler, setResponseHeader } from 'h3'
import { fetchAppContext } from '../../../core/server/utils/appContextApi'
import { stirDrupalApiRequest } from '../../../foundation/server/utils/stirDrupalApi'
import {
  buildLlmsTxt,
  collectLlmsTxtLinks,
  isSiteUrl,
  llmsTxtPath,
  type LlmsTxtMenuItem,
} from '../utils/llmsTxt'
import { fetchPageSummaries } from '../utils/pageSummaryApi'
import { fetchSitemap } from '../utils/sitemapApi'

// A summary for language models, built from the site name, the main menu, the
// sitemap and each page's title and description. Sites that are not
// indexable, or set llmsTxt to false, 404.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const site = getSiteConfig(event)

  if (config.llmsTxt === false || !site.indexable) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const siteUrl = String(site.url || config.siteUrl || '')
  const [context, menu, sitemap] = await Promise.all([
    fetchAppContext(event),
    stirDrupalApiRequest<unknown>(event, '/api/menu_items/main', { method: 'GET' })
      .catch(() => []),
    fetchSitemap(event).catch(() => []),
  ])
  const links = collectLlmsTxtLinks(
    Array.isArray(menu) ? menu as LlmsTxtMenuItem[] : [],
    sitemap,
    siteUrl,
  )
  const summaries = await fetchPageSummaries(event, [
    '/',
    ...[...links.menu.map(({ url }) => url), ...links.pages]
      .filter(url => isSiteUrl(url, siteUrl))
      .map(llmsTxtPath),
  ])

  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')

  return buildLlmsTxt({
    name: context.site_info.name || site.name || '',
    slogan: context.site_info.slogan,
    siteUrl,
    links,
    summaries,
  })
})
