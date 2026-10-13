import type { H3Event } from 'h3'
import {
  applyStirCacheTagsHeader,
  recordStirCacheTags,
} from '../utils/stirCacheTags'

type FetchContext = { response?: { headers?: Headers } }
type FetchHook = (context: FetchContext) => unknown
type FetchOptions = { onResponse?: FetchHook | FetchHook[] } & Record<string, unknown>
type EventFetch = (request: unknown, options?: FetchOptions) => Promise<unknown>

/**
 * Wraps a request's own `$fetch` so the cache tags of every internal request
 * a page renders from (menus, app context, views, listings) reach the page.
 */
export const wrapStirEventFetch = (event: H3Event): void => {
  const holder = event as unknown as { $fetch?: EventFetch }
  const original = holder.$fetch

  if (typeof original !== 'function') return

  const record: FetchHook = ({ response }) => recordStirCacheTags(event, response?.headers)

  holder.$fetch = (request, options = {}) => {
    const existing = options.onResponse
    const onResponse = existing === undefined
      ? record
      : [...(Array.isArray(existing) ? existing : [existing]), record]

    return original(request, { ...options, onResponse })
  }
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    wrapStirEventFetch(event)
  })

  nitroApp.hooks.hook('beforeResponse', (event) => {
    applyStirCacheTagsHeader(event)
  })
})
