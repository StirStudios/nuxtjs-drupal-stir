const readString = (record: unknown, key: string): string => {
  if (typeof record !== 'object' || record === null) return ''

  const value = (record as Record<string, unknown>)[key]

  return typeof value === 'string' ? value.trim() : ''
}

const readData = (error: unknown): unknown =>
  typeof error === 'object' && error !== null
    ? (error as { data?: unknown }).data
    : undefined

/**
 * Picks the message a visitor should see from a failed `$fetch`.
 *
 * Nitro serialises a thrown error as `{ error: true, statusMessage, message }`,
 * so `data.error` is only a message when a route returns Drupal's body as is.
 * The response body is read before `error.statusMessage`, which carries the
 * HTTP status text and is empty over HTTP/2.
 */
export const getFetchErrorMessage = (
  error: unknown,
  fallback = 'Request failed.',
): string => {
  const data = readData(error)

  return readString(data, 'error')
    || readString(data, 'statusMessage')
    || readString(data, 'message')
    || readString(error, 'statusMessage')
    || fallback
}

/**
 * Reads Drupal's machine-readable error `code`, such as
 * `verification_required`, from a failed `$fetch`. Nitro nests the value the
 * proxy forwarded under the body's `data`.
 */
export const getFetchErrorCode = (error: unknown): string => {
  const data = readData(error)

  return readString(data, 'code') || readString(readData(data), 'code')
}
