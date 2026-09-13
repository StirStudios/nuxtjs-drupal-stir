import {
  array,
  getDotPath,
  isValiError,
  minLength,
  nullable,
  number,
  parse,
  pipe,
  strictObject,
  string,
} from 'valibot'
import type {
  SitemapEntry,
  SitemapProducerPayload,
} from '../../shared/types/sitemap'
import {
  getStirDrupalApiConfig,
  stirDrupalApiRequest,
} from '../../../foundation/server/utils/stirDrupalApi'
import {
  mergeSitemapExtensions,
  resolveSitemapExtensions,
} from './sitemapExtensions'

const sitemapSchema = array(strictObject({
  loc: pipe(string(), minLength(1)),
  lastmod: nullable(string()),
  changefreq: nullable(string()),
  priority: nullable(number()),
}))

function contractError(path: string): TypeError {
  return new TypeError(`Invalid Drupal sitemap contract at ${path}`)
}

export function parseSitemapResponse(value: unknown): SitemapProducerPayload {
  try {
    return parse(sitemapSchema, value)
  }
  catch (error) {
    if (isValiError(error)) {
      throw contractError(getDotPath(error.issues[0]) ?? 'root')
    }

    throw error
  }
}

export async function fetchSitemap(
  event: Parameters<typeof stirDrupalApiRequest>[0],
): Promise<SitemapEntry[]> {
  const { requestTimeoutMs } = getStirDrupalApiConfig()
  const [response, extensions] = await Promise.all([
    stirDrupalApiRequest<unknown>(event, '/api/sitemap', {
      method: 'GET',
    }),
    resolveSitemapExtensions(event, requestTimeoutMs),
  ])

  return mergeSitemapExtensions(parseSitemapResponse(response), extensions)
}
