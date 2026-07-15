import { createError, getHeader, getRequestURL, type H3Event } from 'h3'

const toOrigin = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) return ''

  try {
    return new URL(value).origin
  } catch {
    return ''
  }
}

export const assertStirSameOrigin = (event: H3Event): void => {
  const config = useRuntimeConfig() as Record<string, unknown>
  const allowedOrigins = new Set<string>()
  const configuredOrigin = toOrigin(config.siteUrl)

  if (configuredOrigin) {
    allowedOrigins.add(configuredOrigin)
  } else {
    try {
      allowedOrigins.add(getRequestURL(event).origin)
    } catch {
      // Origin evidence below will fail closed without a trusted request URL.
    }
  }

  const originHeader = getHeader(event, 'origin')

  if (originHeader) {
    const origin = toOrigin(originHeader)

    if (origin && allowedOrigins.has(origin)) return

    throw createError({
      statusCode: 403,
      statusMessage: 'Cross-origin request blocked',
    })
  }

  const refererOrigin = toOrigin(getHeader(event, 'referer'))

  if (refererOrigin && allowedOrigins.has(refererOrigin)) return

  if (!originHeader && getHeader(event, 'sec-fetch-site') === 'same-origin') return

  throw createError({
    statusCode: 403,
    statusMessage: 'Cross-origin request blocked',
  })
}
