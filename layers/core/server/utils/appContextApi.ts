import { drupalApiRequest } from './drupalApi'
import type {
  AppContextBlock,
  AppContextFooterMenuItem,
  AppContextPayload,
  AppContextSiteInfo,
} from '../../shared/types/appContext'
import { parseComponentTreeNode } from './componentTree'

export type { AppContextPayload as AppContextResponse } from '../../shared/types/appContext'

const emptyAppContext = (): AppContextPayload => ({
  blocks: {},
  footer_menu: [],
  site_info: {
    name: '',
    mail: '',
    slogan: '',
  },
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function contractError(path: string): TypeError {
  return new TypeError(`Invalid Drupal app-context contract at ${path}`)
}

function parseBlock(value: unknown, path: string): AppContextBlock {
  try {
    return parseComponentTreeNode(value)
  }
  catch {
    throw contractError(path)
  }
}

function parseBlocks(value: unknown): AppContextPayload['blocks'] {
  if (Array.isArray(value)) {
    if (value.length === 0) return {}
    throw contractError('blocks')
  }
  if (!isRecord(value)) throw contractError('blocks')

  return Object.fromEntries(Object.entries(value).map(([region, blocks]) => {
    if (!Array.isArray(blocks)) throw contractError(`blocks.${region}`)

    return [
      region,
      blocks.map((block, index) => parseBlock(block, `blocks.${region}.${index}`)),
    ]
  }))
}

function parseFooterMenu(value: unknown): AppContextFooterMenuItem[] {
  if (!Array.isArray(value)) throw contractError('footer_menu')

  return value.map((item, index) => {
    if (
      !isRecord(item)
      || typeof item.title !== 'string'
      || typeof item.url !== 'string'
    ) {
      throw contractError(`footer_menu.${index}`)
    }

    return { title: item.title, url: item.url }
  })
}

function parseSiteInfo(value: unknown): AppContextSiteInfo {
  if (
    !isRecord(value)
    || typeof value.name !== 'string'
    || typeof value.mail !== 'string'
    || typeof value.slogan !== 'string'
  ) {
    throw contractError('site_info')
  }

  return {
    name: value.name,
    mail: value.mail,
    slogan: value.slogan,
  }
}

export function parseAppContextResponse(value: unknown): AppContextPayload {
  if (!isRecord(value)) throw contractError('root')

  return {
    blocks: parseBlocks(value.blocks),
    footer_menu: parseFooterMenu(value.footer_menu),
    site_info: parseSiteInfo(value.site_info),
  }
}

export function appContextQuery(path = ''): Record<string, string> {
  return path ? { path } : {}
}

export function buildAppContextEndpoint(path = '') {
  return path
    ? `/api/app-context?${new URLSearchParams(appContextQuery(path)).toString()}`
    : '/api/app-context'
}

export function logAppContextFetchError(path: string, error: unknown) {
  const errorRecord = error && typeof error === 'object'
    ? error as Record<string, unknown>
    : {}
  const responseRecord = errorRecord.response && typeof errorRecord.response === 'object'
    ? errorRecord.response as Record<string, unknown>
    : {}
  const message = error instanceof Error ? error.message : String(error)
  const statusCode = typeof errorRecord.statusCode === 'number'
    ? errorRecord.statusCode
    : typeof responseRecord.status === 'number'
      ? responseRecord.status
      : undefined
  const statusMessage = typeof errorRecord.statusMessage === 'string'
    ? errorRecord.statusMessage
    : typeof responseRecord.statusText === 'string'
      ? responseRecord.statusText
      : undefined

  console.error('Failed to fetch Drupal app context', {
    path,
    message,
    statusCode,
    statusMessage,
  })
}

export async function fetchAppContext(event: Parameters<typeof drupalApiRequest>[0], path = '') {
  try {
    const response = await drupalApiRequest<unknown>(event, buildAppContextEndpoint(path), {
      method: 'GET',
      forwardCookies: true,
    })

    return parseAppContextResponse(response)
  }
  catch (error) {
    logAppContextFetchError(path, error)

    return emptyAppContext()
  }
}
