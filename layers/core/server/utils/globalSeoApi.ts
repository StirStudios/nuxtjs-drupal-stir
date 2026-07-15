import type {
  GlobalSeoAttributes,
  GlobalSeoProducerPayload,
  GlobalSeoResponse,
} from '../../shared/types/globalSeo'
import { drupalApiRequest } from './drupalApi'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function contractError(path: string): TypeError {
  return new TypeError(`Invalid Drupal global SEO contract at ${path}`)
}

function parseAttributes(value: unknown, path: string): GlobalSeoAttributes {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    throw contractError(path)
  }

  for (const [key, attribute] of Object.entries(value)) {
    if (typeof attribute !== 'string') throw contractError(`${path}.${key}`)
  }

  return value as GlobalSeoAttributes
}

function parseAttributeList(value: unknown, path: string): GlobalSeoAttributes[] {
  if (!Array.isArray(value)) throw contractError(path)

  return value.map((item, index) => parseAttributes(item, `${path}.${index}`))
}

export function parseGlobalSeoResponse(value: unknown): GlobalSeoProducerPayload {
  if (!isRecord(value)) throw contractError('root')
  if (typeof value.lang !== 'string' || !value.lang) throw contractError('lang')

  return {
    lang: value.lang,
    meta: parseAttributeList(value.meta, 'meta'),
    link: parseAttributeList(value.link, 'link'),
  }
}

export async function fetchGlobalSeo(
  event: Parameters<typeof drupalApiRequest>[0],
): Promise<GlobalSeoResponse> {
  try {
    const response = await drupalApiRequest<unknown>(event, '/api/seo/global', {
      method: 'GET',
    })

    return parseGlobalSeoResponse(response)
  }
  catch {
    return {
      meta: [],
      link: [],
    }
  }
}
