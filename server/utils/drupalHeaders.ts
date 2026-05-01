interface DrupalHeaderOptions {
  apiKey?: string
  cookie?: string
  csrfToken?: string
}

export function buildDrupalHeaders(options: DrupalHeaderOptions = {}): Record<string, string> {
  const headers: Record<string, string> = {}

  if (typeof options.cookie === 'string' && options.cookie.trim()) {
    headers.cookie = options.cookie
  }

  if (typeof options.apiKey === 'string' && options.apiKey.trim()) {
    headers['x-api-key'] = options.apiKey
  }

  if (typeof options.csrfToken === 'string' && options.csrfToken.trim()) {
    headers['x-csrf-token'] = options.csrfToken
    headers['X-CSRF-Token'] = options.csrfToken
  }

  return headers
}
