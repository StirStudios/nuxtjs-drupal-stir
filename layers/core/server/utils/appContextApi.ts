import { drupalApiRequest } from './drupalApi'

export type AppContextResponse = {
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
    return await drupalApiRequest<AppContextResponse>(event, buildAppContextEndpoint(path), {
      method: 'GET',
      forwardCookies: true,
    })
  }
  catch (error) {
    logAppContextFetchError(path, error)

    return { blocks: {} }
  }
}
