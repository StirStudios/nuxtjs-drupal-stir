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
  console.error('Failed to fetch Drupal app context', {
    path,
    error,
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
