import { defineEventHandler, sendRedirect } from 'h3'

// Framework, API and proxy paths keep whatever form their caller requested.
const SKIPPED_PREFIX = /^\/(?:_|api(?:\/|$)|ce-api(?:\/|$))/
const FILE_SEGMENT = /\.[^/]+\/+$/
// Browsers read `\` as `/`, so these could turn into a redirect to another host.
const UNSAFE_PATH = /^\/\/|\\|%5c|%2f/i

export function trailingSlashTarget(path: string): string | undefined {
  const queryStart = path.indexOf('?')
  const pathname = queryStart === -1 ? path : path.slice(0, queryStart)

  if (!pathname.endsWith('/') || UNSAFE_PATH.test(pathname)) return
  if (SKIPPED_PREFIX.test(pathname) || FILE_SEGMENT.test(pathname)) return

  const target = pathname.replace(/\/+$/, '')

  return target ? target + (queryStart === -1 ? '' : path.slice(queryStart)) : undefined
}

// Canonical URLs never end in a slash, so the duplicate form 301s to them.
// Sites opt out with `runtimeConfig: { trailingSlashRedirect: false }`.
export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return
  if (!useRuntimeConfig(event).trailingSlashRedirect) return

  const target = trailingSlashTarget(event.path)

  if (target) return sendRedirect(event, target, 301)
})
